// Hàng chờ pg-boss (nằm trong PostgreSQL, schema pgboss). Việc đã xong xóa sau 7 ngày (GĐ3 mục 0).
import { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';

/** Tên các loại việc. Thêm loại mới ở đây, không viết chuỗi rời trong code. */
export const QUEUES = {
  /** Sự kiện webhook Pancake vừa nhận (chỉ là "chuông gọi", chưa tin cậy) */
  pancakeWebhook: 'pancake-webhook',
  /** Nhịp tim ra Apps Script, mỗi phút, do phần xử lý hàng chờ gửi */
  heartbeat: 'heartbeat',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export async function startBoss(connectionString: string, log: Logger): Promise<PgBoss> {
  const boss = new PgBoss({ connectionString, schema: 'pgboss' });
  boss.on('error', (err: Error) => log.error({ err }, 'Hàng chờ pg-boss gặp lỗi'));
  await boss.start();
  for (const name of Object.values(QUEUES)) {
    // Việc đã xong xóa sau 7 ngày (GĐ3 mục 0). createQueue không làm gì nếu hàng chờ đã có.
    await boss.createQueue(name, { deleteAfterSeconds: 7 * 24 * 3600 });
  }
  return boss;
}
