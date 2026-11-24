// Điểm khởi động của bot. GĐ5: mới có đọc cấu hình và ghi log; các khối khác thêm dần.
import { loadEnv, EnvError } from './config/env.js';
import { createLogger } from './shared/logger.js';
import { formatVn } from './shared/time.js';

async function main(): Promise<void> {
  let env;
  try {
    env = loadEnv();
  } catch (err) {
    if (err instanceof EnvError) {
      process.stderr.write(err.message + '\n');
      process.exit(1);
    }
    throw err;
  }

  const log = createLogger({ level: env.LOG_LEVEL, pretty: env.NODE_ENV !== 'production' });
  log.info(
    { gio: formatVn(), moiTruong: env.NODE_ENV, cong: env.PORT },
    'Bot khởi động (GĐ5 – bộ khung)',
  );
  log.info('Chưa có khối chức năng nào được bật. Các khối sẽ thêm ở các commit sau.');
}

main().catch((err: unknown) => {
  process.stderr.write(`Lỗi khởi động: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
