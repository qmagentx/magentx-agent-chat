// Tạo tài khoản database và database làm việc trên MacBook (chạy MỘT lần, trước npm run migrate).
// Đọc .env: DATABASE_ADMIN_URL (tài khoản chủ) và DATABASE_URL (bot_app + mật khẩu + tên database).
// Tạo nếu chưa có: role bot_app (đăng nhập, mật khẩu lấy từ DATABASE_URL), role backup_reader (chỉ đọc),
// database có tên trong DATABASE_URL. Chạy lại không làm hỏng gì.
// Mật khẩu KHÔNG in ra màn hình.
import { Client } from 'pg';
import { loadEnv } from '../src/config/env.js';

function withDatabase(url: string, dbName: string): string {
  const u = new URL(url);
  u.pathname = `/${dbName}`;
  return u.toString();
}

async function roleExists(client: Client, name: string): Promise<boolean> {
  const r = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [name]);
  return (r.rowCount ?? 0) > 0;
}

async function main(): Promise<void> {
  const env = loadEnv();
  if (!env.DATABASE_ADMIN_URL) {
    throw new Error('Thiếu DATABASE_ADMIN_URL trong .env (tài khoản chủ của PostgreSQL).');
  }
  const botUrl = new URL(env.DATABASE_URL);
  const botUser = decodeURIComponent(botUrl.username);
  const botPassword = decodeURIComponent(botUrl.password);
  const dbName = botUrl.pathname.replace(/^\//, '');
  if (!botUser || !dbName) {
    throw new Error(
      'DATABASE_URL phải có tên tài khoản và tên database, vd postgresql://bot_app:MK@localhost:5432/magentx_test',
    );
  }
  if (botPassword.length < 12) {
    throw new Error('Mật khẩu bot_app trong DATABASE_URL cần ít nhất 12 ký tự.');
  }

  // Nối vào database hệ thống "postgres" để tạo role và database
  const admin = new Client({ connectionString: withDatabase(env.DATABASE_ADMIN_URL, 'postgres') });
  await admin.connect();
  try {
    if (await roleExists(admin, botUser)) {
      process.stdout.write(`  ✓ role ${botUser} đã có – cập nhật mật khẩu theo .env\n`);
      const q = (
        await admin.query<{ q: string }>(
          "SELECT format('ALTER ROLE %I LOGIN PASSWORD %L', $1::text, $2::text) AS q",
          [botUser, botPassword],
        )
      ).rows[0]?.q;
      if (q) await admin.query(q);
    } else {
      const q = (
        await admin.query<{ q: string }>(
          "SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', $1::text, $2::text) AS q",
          [botUser, botPassword],
        )
      ).rows[0]?.q;
      if (q) await admin.query(q);
      process.stdout.write(`  + đã tạo role ${botUser}\n`);
    }

    if (await roleExists(admin, 'backup_reader')) {
      process.stdout.write('  ✓ role backup_reader đã có\n');
    } else {
      await admin.query('CREATE ROLE backup_reader LOGIN');
      process.stdout.write('  + đã tạo role backup_reader (chỉ đọc, đăng nhập trong máy)\n');
    }

    const db = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if ((db.rowCount ?? 0) > 0) {
      process.stdout.write(`  ✓ database ${dbName} đã có\n`);
    } else {
      const q = (
        await admin.query<{ q: string }>("SELECT format('CREATE DATABASE %I', $1::text) AS q", [
          dbName,
        ])
      ).rows[0]?.q;
      if (q) await admin.query(q);
      process.stdout.write(`  + đã tạo database ${dbName}\n`);
    }
  } finally {
    await admin.end();
  }
  process.stdout.write('Xong. Bước tiếp theo: npm run migrate\n');
}

main().catch((err: unknown) => {
  process.stderr.write(
    `Thiết lập database thất bại: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
