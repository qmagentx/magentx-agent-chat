// Khôi phục THỬ một bản sao lưu vào database tạm (mặc định magentx_khoi_phuc_thu) rồi so số dòng với database đang dùng.
// KHÔNG đụng vào database chính. Database tạm cũ bị xóa và tạo lại mỗi lần chạy.
import { spawn } from 'node:child_process';
import { promises as fsp } from 'node:fs';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { createGunzip } from 'node:zlib';
import pg from 'pg';
import type { Logger } from 'pino';
import type { Env } from '../config/env.js';
import { decryptFileToStream } from './crypto.js';
import { databaseNameOf, findPgTool, withCredentials } from './pg.js';

export const SCRATCH_DB = 'magentx_khoi_phuc_thu';

/** Bảng bot ghi liên tục (nhịp tim, sao lưu, tin nhắn…) → có thể lệch vài dòng giữa lúc chụp và lúc so. */
export const LIVE_TABLES = new Set([
  'system_state',
  'messages',
  'bot_turns',
  'ai_calls',
  'alerts',
  'abuse_events',
]);

export interface RestoreResult {
  file: string;
  scratchDb: string;
  tables: Array<{ table: string; source: number; restored: number; match: boolean; live: boolean }>;
  /** Mọi bảng không "sống" khớp tuyệt đối */
  allMatch: boolean;
}

export async function latestBackupFile(backupDir: string, database: string): Promise<string> {
  const names = (await fsp.readdir(backupDir))
    .filter((n) => n.startsWith(`${database}_`) && n.endsWith('.sql.gz.enc'))
    .sort();
  const last = names.at(-1);
  if (!last)
    throw new Error(`Không có bản sao lưu nào trong ${backupDir}/ cho database ${database}`);
  return join(backupDir, last);
}

export async function restoreToScratch(
  env: Env,
  log: Logger,
  file: string,
): Promise<RestoreResult> {
  if (!env.BACKUP_PASSWORD) throw new Error('Thiếu BACKUP_PASSWORD trong .env');
  if (!env.DATABASE_ADMIN_URL)
    throw new Error('Thiếu DATABASE_ADMIN_URL trong .env (cần để tạo database tạm)');
  const sourceDb = databaseNameOf(env.DATABASE_URL);
  if (SCRATCH_DB === sourceDb)
    throw new Error('Database tạm trùng tên database chính – dừng để an toàn');

  // 1. Xóa và tạo lại database tạm (chỉ database tạm!)
  const admin = new pg.Client({
    connectionString: withCredentials(env.DATABASE_ADMIN_URL, { database: 'postgres' }),
  });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${quoteIdent(SCRATCH_DB)} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${quoteIdent(SCRATCH_DB)}`);
  } finally {
    await admin.end();
  }
  log.info({ scratchDb: SCRATCH_DB }, 'Đã tạo lại database tạm');

  // 2. Giải mã → giải nén → psql vào database tạm
  const psql = findPgTool('psql', env.PG_BIN_DIR);
  const scratchUrl = withCredentials(env.DATABASE_ADMIN_URL, { database: SCRATCH_DB });
  const child = spawn(psql, ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '--dbname', scratchUrl], {
    stdio: ['pipe', 'ignore', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
  const exit = new Promise<number>((resolve) => child.on('close', (code) => resolve(code ?? -1)));
  const gunzip = createGunzip();
  const pass = new PassThrough();
  pass.pipe(gunzip).pipe(child.stdin);
  await decryptFileToStream(file, pass, env.BACKUP_PASSWORD);
  const code = await exit;
  if (code !== 0)
    throw new Error(`psql khôi phục thoát mã ${code}: ${stderr.trim().slice(0, 800)}`);

  // 3. So số dòng từng bảng trong schema app
  const tables = await compareRowCounts(env.DATABASE_ADMIN_URL, scratchUrl);
  const allMatch = tables.every((t) => t.match || t.live);
  log.info({ soBang: tables.length, khop: allMatch }, 'So số dòng nguồn ↔ khôi phục');
  return { file, scratchDb: SCRATCH_DB, tables, allMatch };
}

async function compareRowCounts(
  sourceUrl: string,
  scratchUrl: string,
): Promise<RestoreResult['tables']> {
  const countAll = async (url: string): Promise<Map<string, number>> => {
    const c = new pg.Client({ connectionString: url });
    await c.connect();
    try {
      const names = (
        await c.query<{ table_name: string }>(
          `SELECT table_name FROM information_schema.tables WHERE table_schema='app' AND table_type='BASE TABLE' ORDER BY 1`,
        )
      ).rows.map((r) => r.table_name);
      const out = new Map<string, number>();
      for (const t of names) {
        const r = await c.query<{ n: string }>(
          `SELECT count(*)::text AS n FROM app.${quoteIdent(t)}`,
        );
        out.set(t, Number(r.rows[0]?.n ?? 0));
      }
      return out;
    } finally {
      await c.end();
    }
  };
  const [src, dst] = await Promise.all([countAll(sourceUrl), countAll(scratchUrl)]);
  const names = [...new Set([...src.keys(), ...dst.keys()])].sort();
  return names.map((table) => {
    const source = src.get(table) ?? -1;
    const restored = dst.get(table) ?? -1;
    return { table, source, restored, match: source === restored, live: LIVE_TABLES.has(table) };
  });
}

function quoteIdent(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error(`Tên không hợp lệ: ${name}`);
  return `"${name}"`;
}
