// Máy chủ web nhận webhook Pancake. Chỉ có MỘT địa chỉ: /webhook/<mã bí mật>.
// Webhook không có chữ ký → chỉ là "chuông gọi": nhận, xếp vào hàng chờ, trả 200 ngay.
// Sai mã → trả 404 như không tồn tại và ghi nhật ký. Mọi địa chỉ khác → 404.
import { timingSafeEqual } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Logger } from 'pino';

/** So mã bí mật theo thời gian cố định (không lộ độ dài/độ giống qua thời gian phản hồi). */
export function isValidSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

export interface WebhookEvent {
  receivedAt: string;
  body: unknown;
}

export interface WebhookServerOptions {
  secretPath: string;
  log: Logger;
  /** Xếp sự kiện vào hàng chờ. Ném lỗi → trả 500 để Pancake gửi lại (nếu có). */
  onEvent: (event: WebhookEvent) => Promise<void>;
}

export function buildWebhookServer(opts: WebhookServerOptions): FastifyInstance {
  const app = Fastify({ logger: false, bodyLimit: 1_000_000, trustProxy: true });

  app.setNotFoundHandler(async (_req, reply) => reply.code(404).send('Not found'));
  app.setErrorHandler(async (err, req, reply) => {
    opts.log.error({ err, url: req.url.replace(opts.secretPath, '<mã>') }, 'Lỗi xử lý yêu cầu web');
    return reply.code(500).send('error');
  });

  // Một số dịch vụ kiểm tra địa chỉ bằng GET trước khi lưu
  app.get('/webhook/:secret', async (req, reply) => {
    const { secret } = req.params as { secret: string };
    if (!isValidSecret(secret, opts.secretPath)) return reply.code(404).send('Not found');
    return reply.code(200).send('ok');
  });

  app.post('/webhook/:secret', async (req, reply) => {
    const { secret } = req.params as { secret: string };
    if (!isValidSecret(secret, opts.secretPath)) {
      opts.log.warn({ ip: req.ip }, 'Webhook gọi tới với mã bí mật SAI – bỏ qua');
      return reply.code(404).send('Not found');
    }
    await opts.onEvent({ receivedAt: new Date().toISOString(), body: req.body });
    return reply.code(200).send('ok');
  });

  return app;
}
