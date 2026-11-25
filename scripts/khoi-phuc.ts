// Khôi phục THỬ vào database tạm:  npm run khoi-phuc            (bản mới nhất)
//                                  npm run khoi-phuc -- backups/<tên file>
// Không đụng database chính. Chỉ xóa/tạo lại database tạm magentx_khoi_phuc_thu.
import { loadEnv } from '../src/config/env.js';
import { createLogger } from '../src/shared/logger.js';
import { databaseNameOf } from '../src/backup/pg.js';
import { latestBackupFile, restoreToScratch } from '../src/backup/restore.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const log = createLogger({ level: env.LOG_LEVEL, pretty: true });
  const file =
    process.argv[2] ?? (await latestBackupFile('backups', databaseNameOf(env.DATABASE_URL)));
  const r = await restoreToScratch(env, log, file);
  process.stdout.write(`\nFile: ${r.file}\nDatabase tạm: ${r.scratchDb}\n`);
  for (const t of r.tables) {
    process.stdout.write(
      `  ${t.match ? '✓' : '✗'} ${t.table.padEnd(24)} nguồn ${t.source}  khôi phục ${t.restored}\n`,
    );
  }
  process.stdout.write(
    r.allMatch
      ? 'KẾT QUẢ: khôi phục khớp toàn bộ.\n'
      : 'KẾT QUẢ: CÓ BẢNG KHÔNG KHỚP – xem dòng ✗.\n',
  );
  if (!r.allMatch) process.exit(2);
}

main().catch((err: unknown) => {
  process.stderr.write(
    `Khôi phục thử thất bại: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
