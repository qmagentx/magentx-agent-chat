// Tìm công cụ PostgreSQL (pg_dump, psql) trên máy và dựng địa chỉ kết nối cho các vai trò.
import { accessSync, constants } from 'node:fs';
import { join } from 'node:path';

const CANDIDATE_DIRS = [
  '/Applications/Postgres.app/Contents/Versions/latest/bin', // Postgres.app trên Mac
  '/usr/local/bin',
  '/opt/homebrew/bin',
  '/usr/bin',
];

/** Đường dẫn tới pg_dump / psql. Ưu tiên PG_BIN_DIR trong .env nếu có. */
export function findPgTool(tool: 'pg_dump' | 'psql', pgBinDir?: string): string {
  const dirs = pgBinDir ? [pgBinDir, ...CANDIDATE_DIRS] : CANDIDATE_DIRS;
  for (const dir of dirs) {
    const full = join(dir, tool);
    try {
      accessSync(full, constants.X_OK);
      return full;
    } catch {
      // thử thư mục kế tiếp
    }
  }
  throw new Error(
    `Không tìm thấy ${tool}. Nếu dùng Postgres.app, mở ứng dụng lên; hoặc điền PG_BIN_DIR trong .env trỏ tới thư mục chứa ${tool}.`,
  );
}

/** Đổi tài khoản/mật khẩu/database trong một địa chỉ kết nối. */
export function withCredentials(
  url: string,
  opts: { user?: string; password?: string; database?: string },
): string {
  const u = new URL(url);
  if (opts.user !== undefined) u.username = opts.user;
  if (opts.password !== undefined) u.password = opts.password;
  if (opts.database !== undefined) u.pathname = `/${opts.database}`;
  return u.toString();
}

export function databaseNameOf(url: string): string {
  return new URL(url).pathname.replace(/^\//, '');
}
