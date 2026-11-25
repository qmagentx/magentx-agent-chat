// Nhịp tim ra "người canh" Google Apps Script, mỗi phút, do PHẦN XỬ LÝ HÀNG CHỜ gửi.
// Nội dung: mã bí mật, giờ gửi, số việc đang chờ, tin chưa trả lời lâu nhất (phút). KHÔNG dữ liệu khách.
import type { Logger } from 'pino';

export interface HeartbeatPayload {
  secret: string;
  sent_at: string;
  queue_size: number;
  oldest_unanswered_minutes: number | null;
}

export interface SendHeartbeatOptions {
  url: string;
  secret: string;
  queueSize: number;
  oldestUnansweredMinutes: number | null;
  log: Logger;
  timeoutMs?: number;
}

/** Trả về true nếu người canh nhận được (HTTP 2xx sau khi theo chuyển hướng của Google). */
export async function sendHeartbeat(opts: SendHeartbeatOptions): Promise<boolean> {
  const payload: HeartbeatPayload = {
    secret: opts.secret,
    sent_at: new Date().toISOString(),
    queue_size: opts.queueSize,
    oldest_unanswered_minutes: opts.oldestUnansweredMinutes,
  };
  const started = Date.now();
  try {
    const res = await fetch(opts.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: AbortSignal.timeout(opts.timeoutMs ?? 10_000),
    });
    const ok = res.ok;
    opts.log[ok ? 'debug' : 'warn'](
      { status: res.status, ms: Date.now() - started },
      'Nhịp tim → người canh',
    );
    return ok;
  } catch (err) {
    opts.log.warn({ err, ms: Date.now() - started }, 'Không gửi được nhịp tim');
    return false;
  }
}
