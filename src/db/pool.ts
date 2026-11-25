// Kết nối PostgreSQL bằng tài khoản bot_app (quyền giới hạn). Một bể kết nối dùng chung cho cả bot.
import pg from 'pg';

export type DbPool = pg.Pool;

export function createPool(connectionString: string): DbPool {
  return new pg.Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });
}

/** Kiểm tra kết nối và số bảng trong schema app. Dùng lúc khởi động. */
export async function checkDb(
  pool: DbPool,
): Promise<{ user: string; database: string; tables: number }> {
  const r = await pool.query<{ user: string; database: string; tables: string }>(`
    SELECT current_user AS "user", current_database() AS database,
           (SELECT count(*) FROM information_schema.tables
             WHERE table_schema = 'app' AND table_type = 'BASE TABLE'
               AND table_name <> 'schema_migrations')::text AS tables`);
  const row = r.rows[0];
  if (!row) throw new Error('Không đọc được thông tin database');
  return { user: row.user, database: row.database, tables: Number(row.tables) };
}

/** Ghi một khóa vào app.system_state (bot/Telegram là nơi duy nhất được ghi bảng này). */
export async function setSystemState(pool: DbPool, key: string, value: unknown): Promise<void> {
  await pool.query(
    `INSERT INTO app.system_state (key, value, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
}
