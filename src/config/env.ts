// Đọc file .env và kiểm tra. Thiếu/sai → báo lỗi tiếng Việt, nêu rõ biến nào, không khởi động bot.
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

/** Chuỗi tùy chọn: để trống trong .env coi như không có. */
const optionalString = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().optional(),
);

const optionalNumber = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.coerce.number().int().optional(),
);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  WEBHOOK_SECRET_PATH: z
    .string({ error: 'bắt buộc – mã bí mật dài gắn trên địa chỉ webhook' })
    .min(24, 'cần ít nhất 24 ký tự ngẫu nhiên (mã bí mật trên địa chỉ webhook)')
    .regex(/^[A-Za-z0-9_-]+$/, 'chỉ dùng chữ, số, gạch ngang, gạch dưới'),

  DATABASE_URL: z
    .string({ error: 'bắt buộc – địa chỉ kết nối PostgreSQL cho tài khoản bot_app' })
    .min(1, 'bắt buộc – địa chỉ kết nối PostgreSQL cho tài khoản bot_app')
    .regex(/^postgres(ql)?:\/\//, 'phải bắt đầu bằng postgresql://'),
  DATABASE_ADMIN_URL: optionalString,

  ANTHROPIC_API_KEY: optionalString,
  CLAUDE_MODEL_DEFAULT: z.string().default('claude-haiku-5-5'),
  CLAUDE_MODEL_DEEP: z.string().default('claude-sonnet-5-5'),

  PANCAKE_TEST_PAGE_ID: optionalString,
  PANCAKE_TEST_PAGE_TOKEN: optionalString,

  TELEGRAM_BOT_TOKEN: optionalString,
  TELEGRAM_ADMIN_ID: optionalNumber,

  HEARTBEAT_URL: optionalString,
  HEARTBEAT_SECRET: optionalString,

  BACKUP_PASSWORD: optionalString,
  BACKUP_READER_PASSWORD: optionalString,
  PG_BIN_DIR: optionalString,
  GOOGLE_SERVICE_ACCOUNT_FILE: optionalString,
  DRIVE_BACKUP_FOLDER_ID: optionalString,
});

export type Env = z.infer<typeof envSchema>;

export class EnvError extends Error {
  constructor(public readonly problems: string[]) {
    super(
      [
        'Cấu hình trong file .env chưa đúng:',
        ...problems.map((p) => `  - ${p}`),
        'Mở file .env.example để xem mẫu và ghi chú từng biến.',
      ].join('\n'),
    );
    this.name = 'EnvError';
  }
}

/**
 * Đọc cấu hình. Không truyền gì → đọc file .env rồi lấy từ process.env.
 * Truyền `source` → chỉ kiểm tra đúng nguồn đó (dùng trong kiểm thử).
 */
export function loadEnv(source?: Record<string, string | undefined>): Env {
  let input = source;
  if (!input) {
    loadDotenv({ quiet: true });
    input = process.env;
  }
  const result = envSchema.safeParse(input);
  if (result.success) return result.data;

  const problems = result.error.issues.map((issue) => {
    const name = issue.path.join('.') || '(chung)';
    return `${name}: ${issue.message}`;
  });
  throw new EnvError(problems);
}
