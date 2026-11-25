// Sao lưu database ngay bây giờ:  npm run sao-luu
// (Lịch 2 giờ/lần sẽ gọi cùng hàm này từ bot ở bước sau.)
import { loadEnv } from '../src/config/env.js';
import { createLogger } from '../src/shared/logger.js';
import { runBackup } from '../src/backup/backup.js';

const env = loadEnv();
const log = createLogger({ level: env.LOG_LEVEL, pretty: true });
runBackup(env, log)
  .then((r) => {
    process.stdout.write(
      `\nĐã sao lưu: ${r.file} (${Math.round(r.sizeBytes / 1024)} KB, ${r.durationMs} ms)\n`,
    );
    if (!r.driveUploaded)
      process.stdout.write('Lưu ý: bản này chỉ nằm trên máy, chưa lên Google Drive.\n');
  })
  .catch((err: unknown) => {
    process.stderr.write(`Sao lưu thất bại: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
