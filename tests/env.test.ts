import { describe, expect, it } from 'vitest';
import { EnvError, loadEnv } from '../src/config/env.js';

const hopLe = {
  WEBHOOK_SECRET_PATH: 'abcdefghijklmnopqrstuvwxyz123456',
  DATABASE_URL: 'postgresql://bot_app:x@localhost:5432/magentx_test',
};

describe('loadEnv – kiểm tra cấu hình', () => {
  it('đủ biến bắt buộc → trả cấu hình với giá trị mặc định', () => {
    const env = loadEnv(hopLe);
    expect(env.PORT).toBe(3000);
    expect(env.CLAUDE_MODEL_DEFAULT).toBe('claude-haiku-5-5');
    expect(env.TELEGRAM_BOT_TOKEN).toBeUndefined();
  });
  it('biến tùy chọn để trống → coi như không có', () => {
    const env = loadEnv({ ...hopLe, TELEGRAM_BOT_TOKEN: '', TELEGRAM_ADMIN_ID: '' });
    expect(env.TELEGRAM_BOT_TOKEN).toBeUndefined();
    expect(env.TELEGRAM_ADMIN_ID).toBeUndefined();
  });
  it('thiếu DATABASE_URL và mã webhook ngắn → báo lỗi tiếng Việt nêu tên biến', () => {
    let loi: unknown;
    try {
      loadEnv({ WEBHOOK_SECRET_PATH: 'ngan' });
    } catch (e) {
      loi = e;
    }
    expect(loi).toBeInstanceOf(EnvError);
    const msg = (loi as EnvError).message;
    expect(msg).toContain('DATABASE_URL');
    expect(msg).toContain('WEBHOOK_SECRET_PATH');
    expect(msg).toContain('.env.example');
  });
});
