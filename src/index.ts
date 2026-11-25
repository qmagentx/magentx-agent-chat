// Điểm khởi động của bot. Thứ tự: cấu hình → database → hàng chờ → web (webhook) → vòng quét → Telegram → nhịp tim.
// Khối nào thiếu cấu hình trong .env thì bỏ qua và nói rõ trong log, bot vẫn chạy phần còn lại.
import type { PgBoss } from 'pg-boss';
import { loadEnv, EnvError, type Env } from './config/env.js';
import { createLogger } from './shared/logger.js';
import { formatVn } from './shared/time.js';
import { checkDb, createPool, setSystemState, type DbPool } from './db/pool.js';
import { QUEUES, startBoss } from './queue/boss.js';
import { buildWebhookServer, type WebhookEvent } from './pancake/webhook.js';
import { PancakeClient } from './pancake/client.js';
import { startPoll } from './pancake/poll.js';
import { sendHeartbeat } from './heartbeat/sender.js';
import { createTelegramBot } from './telegram/bot.js';

/** Liệt kê tên các trường ở tầng ngoài của sự kiện (để biết Pancake gửi gì), không ghi nội dung. */
function topLevelKeys(body: unknown): string[] {
  return body && typeof body === 'object' ? Object.keys(body as object) : [typeof body];
}

async function main(): Promise<void> {
  let env: Env;
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
  log.info({ gio: formatVn(), moiTruong: env.NODE_ENV }, 'Bot khởi động (GĐ5 – bộ khung)');
  const stoppers: Array<() => Promise<void> | void> = [];

  // 1. Database
  const pool: DbPool = createPool(env.DATABASE_URL);
  const db = await checkDb(pool);
  log.info({ taiKhoan: db.user, database: db.database, soBang: db.tables }, 'Database: đã kết nối');
  stoppers.push(() => pool.end());

  // 2. Hàng chờ
  const boss: PgBoss = await startBoss(env.DATABASE_URL, log);
  log.info('Hàng chờ pg-boss: đã chạy');
  stoppers.push(() => boss.stop({ graceful: true, timeout: 5_000 }));

  await boss.work<WebhookEvent>(QUEUES.pancakeWebhook, async (jobs) => {
    for (const job of jobs) {
      const ev = job.data;
      log.info(
        { nhanLuc: ev.receivedAt, truong: topLevelKeys(ev.body) },
        'Sự kiện webhook Pancake (GĐ5: chỉ ghi nhận)',
      );
    }
  });

  // 3. Web nhận webhook
  const app = buildWebhookServer({
    secretPath: env.WEBHOOK_SECRET_PATH,
    log,
    onEvent: async (event) => {
      await boss.send(QUEUES.pancakeWebhook, event);
    },
  });
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  log.info({ cong: env.PORT, duongDan: '/webhook/<mã bí mật>' }, 'Web: đang nhận webhook');
  stoppers.push(() => app.close());

  // 4. Vòng quét Pancake (cần token trang thử)
  if (env.PANCAKE_TEST_PAGE_ID && env.PANCAKE_TEST_PAGE_TOKEN) {
    const client = new PancakeClient({
      pageId: env.PANCAKE_TEST_PAGE_ID,
      accessToken: env.PANCAKE_TEST_PAGE_TOKEN,
      log,
    });
    const poll = startPoll({ client, log });
    stoppers.push(poll.stop);
    log.info({ trang: env.PANCAKE_TEST_PAGE_ID }, 'Vòng quét Pancake 30 giây: đã chạy');
  } else {
    log.warn(
      'Vòng quét Pancake: BỎ QUA vì chưa có PANCAKE_TEST_PAGE_ID / PANCAKE_TEST_PAGE_TOKEN trong .env',
    );
  }

  // 5. Telegram (long polling)
  if (env.TELEGRAM_BOT_TOKEN) {
    const bot = createTelegramBot({
      token: env.TELEGRAM_BOT_TOKEN,
      adminId: env.TELEGRAM_ADMIN_ID,
      log,
    });
    void bot.start({
      onStart: (me) =>
        log.info(
          {
            bot: me.username,
            cheDo: env.TELEGRAM_ADMIN_ID ? 'chỉ quản trị' : 'cài đặt (chưa có TELEGRAM_ADMIN_ID)',
          },
          'Telegram: đang long polling',
        ),
    });
    stoppers.push(() => bot.stop());
  } else {
    log.warn('Telegram: BỎ QUA vì chưa có TELEGRAM_BOT_TOKEN trong .env');
  }

  // 6. Nhịp tim mỗi phút – đặt lịch trong pg-boss nên chỉ chạy khi phần xử lý hàng chờ còn sống
  await boss.work(QUEUES.heartbeat, async () => {
    const stats = await boss.getQueueStats(QUEUES.pancakeWebhook);
    const queueSize = stats.reduce((sum, q) => sum + q.queuedCount + q.activeCount, 0);
    await setSystemState(pool, 'last_heartbeat_at', new Date().toISOString());
    if (env.HEARTBEAT_URL && env.HEARTBEAT_SECRET) {
      await sendHeartbeat({
        url: env.HEARTBEAT_URL,
        secret: env.HEARTBEAT_SECRET,
        queueSize,
        oldestUnansweredMinutes: null,
        log,
      });
    }
  });
  await boss.schedule(QUEUES.heartbeat, '* * * * *');
  if (env.HEARTBEAT_URL && env.HEARTBEAT_SECRET) {
    log.info('Nhịp tim: mỗi phút → người canh Apps Script');
  } else {
    log.warn(
      'Nhịp tim: chỉ ghi vào database (chưa có HEARTBEAT_URL / HEARTBEAT_SECRET trong .env)',
    );
  }

  log.info('Khởi động xong. Bấm Ctrl+C để dừng.');

  const shutdown = async (signal: string): Promise<void> => {
    log.info({ signal }, 'Đang dừng bot…');
    for (const stop of stoppers.reverse()) {
      try {
        await stop();
      } catch (err) {
        log.warn({ err }, 'Lỗi khi dừng một khối');
      }
    }
    log.info('Đã dừng.');
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err: unknown) => {
  process.stderr.write(
    `Lỗi khởi động: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`,
  );
  process.exit(1);
});
