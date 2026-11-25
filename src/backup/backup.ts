// Sao lưu database: pg_dump (tài khoản backup_reader, chỉ đọc) → gzip → mã hóa → backups/ → (Drive khi có cấu hình).
// Sau khi xong: ghi app.system_state.last_backup_ok_at và dọn bản cũ theo quy tắc giữ lại.
import { spawn } from 'node:child_process';
import { promises as fsp } from 'node:fs';
import { join } from 'node:path';
import { createGzip } from 'node:zlib';
import pg from 'pg';
import type { Logger } from 'pino';
import type { Env } from '../config/env.js';
import { vnParts } from '../shared/time.js';
import { encryptStreamToFile } from './crypto.js';
import { databaseNameOf, findPgTool, withCredentials } from './pg.js';
import { chooseFilesToDelete, parseBackupName, type BackupFileInfo } from './retention.js';

export interface BackupResult {
  file: string;
  sizeBytes: number;
  durationMs: number;
  deleted: string[];
  driveUploaded: boolean;
}

const pad2 = (n: number): string => n.toString().padStart(2, '0');

export function backupFileName(database: string, at: Date = new Date()): string {
  const p = vnParts(at);
  return `${database}_${p.year}-${pad2(p.month)}-${pad2(p.day)}_${pad2(p.hour)}${pad2(p.minute)}.sql.gz.enc`;
}

export async function runBackup(
  env: Env,
  log: Logger,
  backupDir = 'backups',
): Promise<BackupResult> {
  if (!env.BACKUP_PASSWORD) {
    throw new Error(
      'Thiếu BACKUP_PASSWORD trong .env (mật khẩu mã hóa bản sao lưu, ít nhất 12 ký tự).',
    );
  }
  const started = Date.now();
  const database = databaseNameOf(env.DATABASE_URL);
  const readerUrl = withCredentials(env.DATABASE_URL, {
    user: 'backup_reader',
    password: env.BACKUP_READER_PASSWORD ?? '',
  });
  const pgDump = findPgTool('pg_dump', env.PG_BIN_DIR);
  await fsp.mkdir(backupDir, { recursive: true });
  const file = join(backupDir, backupFileName(database));
  const tmp = `${file}.tmp`;

  // --no-owner --no-privileges: khôi phục được vào database tạm bằng tài khoản khác
  const child = spawn(
    pgDump,
    ['--no-owner', '--no-privileges', '--format=plain', '--dbname', readerUrl],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let stderr = '';
  child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
  const exit = new Promise<number>((resolve) => child.on('close', (code) => resolve(code ?? -1)));

  try {
    await encryptStreamToFile(
      child.stdout.pipe(createGzip({ level: 6 })),
      tmp,
      env.BACKUP_PASSWORD,
    );
    const code = await exit;
    if (code !== 0) throw new Error(`pg_dump thoát mã ${code}: ${stderr.trim().slice(0, 500)}`);
    await fsp.rename(tmp, file);
  } catch (err) {
    await fsp.rm(tmp, { force: true });
    throw err;
  }

  const { size } = await fsp.stat(file);
  const deleted = await pruneBackups(backupDir, database, log);
  const driveUploaded = await uploadToDriveIfConfigured(env, file, log);
  await markBackupOk(env, file);

  const result: BackupResult = {
    file,
    sizeBytes: size,
    durationMs: Date.now() - started,
    deleted,
    driveUploaded,
  };
  log.info(
    {
      file,
      kb: Math.round(size / 1024),
      ms: result.durationMs,
      daXoa: deleted.length,
      drive: driveUploaded,
    },
    'Sao lưu xong',
  );
  return result;
}

/** Xóa bản cũ trong backups/ theo quy tắc 24 bản + 14 ngày. Chỉ đụng file của đúng database này. */
export async function pruneBackups(
  backupDir: string,
  database: string,
  log: Logger,
): Promise<string[]> {
  const names = (await fsp.readdir(backupDir)).filter(
    (n) => n.startsWith(`${database}_`) && n.endsWith('.sql.gz.enc'),
  );
  const files: BackupFileInfo[] = [];
  for (const name of names) {
    const createdAt = parseBackupName(name);
    if (createdAt) files.push({ name, createdAt });
  }
  const toDelete = chooseFilesToDelete(files);
  for (const f of toDelete) {
    await fsp.rm(join(backupDir, f.name), { force: true });
    log.info({ file: f.name }, 'Đã xóa bản sao lưu cũ theo quy tắc giữ lại');
  }
  return toDelete.map((f) => f.name);
}

/** Đẩy lên Google Drive khi đã có tài khoản dịch vụ. GĐ5: chưa có → bỏ qua và nói rõ. */
async function uploadToDriveIfConfigured(env: Env, _file: string, log: Logger): Promise<boolean> {
  if (!env.GOOGLE_SERVICE_ACCOUNT_FILE || !env.DRIVE_BACKUP_FOLDER_ID) {
    log.warn(
      'Drive: chưa cấu hình GOOGLE_SERVICE_ACCOUNT_FILE / DRIVE_BACKUP_FOLDER_ID → bản sao lưu chỉ nằm trên máy',
    );
    return false;
  }
  // Sẽ làm khi có tài khoản dịch vụ Google (cần anh/chị tạo trên Google Cloud, hướng dẫn ở bước đó).
  log.warn('Drive: phần đẩy lên Drive chưa viết (chờ tài khoản dịch vụ Google)');
  return false;
}

async function markBackupOk(env: Env, file: string): Promise<void> {
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO app.system_state (key, value, updated_at) VALUES ('last_backup_ok_at', $1::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [JSON.stringify({ at: new Date().toISOString(), file })],
    );
  } finally {
    await client.end();
  }
}
