// Vòng quét dự phòng 30 giây: hỏi Pancake "hội thoại nào có tin mới" kể cả khi webhook không gọi tới.
// GĐ5: chỉ đếm và ghi log để đo; GĐ6 mới xếp tin vào hàng chờ xử lý.
import type { Logger } from 'pino';
import type { PancakeClient } from './client.js';

export interface PollOptions {
  client: PancakeClient;
  log: Logger;
  intervalMs?: number;
  /** Nhìn lùi thêm bao nhiêu giây so với lần quét trước để không sót tin ở biên */
  overlapSec?: number;
}

export function startPoll(opts: PollOptions): { stop: () => void } {
  const intervalMs = opts.intervalMs ?? 30_000;
  const overlapSec = opts.overlapSec ?? 60;
  let lastRunSec = Math.floor(Date.now() / 1000) - overlapSec;
  let running = false;

  const tick = async (): Promise<void> => {
    if (running) return; // lần trước chưa xong thì bỏ lượt này
    running = true;
    const nowSec = Math.floor(Date.now() / 1000);
    try {
      const result = await opts.client.listConversations({
        sinceSec: lastRunSec - overlapSec,
        untilSec: nowSec,
      });
      const count = countConversations(result);
      opts.log.info({ since: lastRunSec - overlapSec, until: nowSec, count }, 'Vòng quét Pancake');
      lastRunSec = nowSec;
    } catch (err) {
      opts.log.warn({ err }, 'Vòng quét Pancake lỗi, sẽ thử lại lượt sau');
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => void tick(), intervalMs);
  void tick();
  return { stop: () => clearInterval(timer) };
}

/** Pancake trả về { conversations: [...] } hoặc mảng; đếm an toàn. */
export function countConversations(result: unknown): number {
  if (Array.isArray(result)) return result.length;
  if (result && typeof result === 'object') {
    const list = (result as Record<string, unknown>).conversations;
    if (Array.isArray(list)) return list.length;
  }
  return 0;
}
