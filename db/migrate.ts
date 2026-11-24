// Chạy migration theo thứ tự tên file trong db/migrations/. Dùng tài khoản chủ (DATABASE_ADMIN_URL).
// - Ghi nhớ file đã chạy + checksum trong app.schema_migrations; chạy lại không làm gì.
// - File đã chạy mà nội dung bị sửa → DỪNG và báo lỗi (quy tắc: file đã chạy không sửa).
// - Mỗi file chạy trong một giao dịch: lỗi giữa chừng → hoàn tác cả file.
// Cách dùng:  npm run migrate            → chạy các file chưa chạy
//             npm run migrate -- --status → chỉ xem trạng thái
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';
import { loadEnv } from '../src/config/env.js';

const MIGRATIONS_DIR = new URL('./migrations/', import.meta.url);

interface MigrationFile {
  name: string;
  sql: string;
  checksum: string;
}

function readMigrationFiles(): MigrationFile[] {
  const dir = MIGRATIONS_DIR.pathname;
  return readdirSync(dir)
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .sort()
    .map((name) => {
      const sql = readFileSync(join(dir, name), 'utf8');
      return { name, sql, checksum: createHash('sha256').update(sql).digest('hex') };
    });
}

async function main(): Promise<void> {
  const statusOnly = process.argv.includes('--status');
  const env = loadEnv();
  if (!env.DATABASE_ADMIN_URL) {
    throw new Error(
      'Thiếu DATABASE_ADMIN_URL trong .env (tài khoản chủ, chỉ dùng để chạy migration).',
    );
  }

  const client = new Client({ connectionString: env.DATABASE_ADMIN_URL });
  await client.connect();
  const dbName = (await client.query<{ db: string }>('SELECT current_database() AS db')).rows[0]
    ?.db;
  process.stdout.write(`Database: ${dbName}\n`);

  try {
    await client.query('CREATE SCHEMA IF NOT EXISTS app');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app.schema_migrations (
        name        text PRIMARY KEY,
        checksum    text NOT NULL,
        applied_at  timestamptz NOT NULL DEFAULT now()
      )`);

    const applied = new Map<string, string>();
    for (const row of (
      await client.query<{ name: string; checksum: string }>(
        'SELECT name, checksum FROM app.schema_migrations',
      )
    ).rows) {
      applied.set(row.name, row.checksum);
    }

    const files = readMigrationFiles();
    let ran = 0;
    for (const file of files) {
      const prev = applied.get(file.name);
      if (prev !== undefined) {
        if (prev !== file.checksum) {
          throw new Error(
            `File ${file.name} ĐÃ CHẠY nhưng nội dung đã bị sửa. Không được sửa file đã chạy; hãy thêm file mới.`,
          );
        }
        process.stdout.write(`  ✓ ${file.name} (đã chạy trước đó)\n`);
        continue;
      }
      if (statusOnly) {
        process.stdout.write(`  • ${file.name} (CHƯA chạy)\n`);
        continue;
      }
      process.stdout.write(`  → đang chạy ${file.name} …`);
      await client.query('BEGIN');
      try {
        await client.query(file.sql);
        await client.query('INSERT INTO app.schema_migrations (name, checksum) VALUES ($1, $2)', [
          file.name,
          file.checksum,
        ]);
        await client.query('COMMIT');
        process.stdout.write(' xong\n');
        ran += 1;
      } catch (err) {
        await client.query('ROLLBACK');
        process.stdout.write(' LỖI\n');
        throw err;
      }
    }

    const tables = await client.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM information_schema.tables
       WHERE table_schema = 'app' AND table_type = 'BASE TABLE' AND table_name <> 'schema_migrations'`,
    );
    process.stdout.write(
      statusOnly
        ? `Số bảng trong schema app: ${tables.rows[0]?.n}\n`
        : `Hoàn tất: ${ran} file mới chạy, ${files.length - ran} file đã có. Số bảng trong schema app: ${tables.rows[0]?.n}\n`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`Migration thất bại: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
