import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { buildWebhookServer, isValidSecret, type WebhookEvent } from '../src/pancake/webhook.js';
import { countConversations } from '../src/pancake/poll.js';

const SECRET = 'abcdefghijklmnopqrstuvwxyz0123456789ABCD';

describe('isValidSecret', () => {
  it('đúng mã → true, sai/khác độ dài/rỗng → false', () => {
    expect(isValidSecret(SECRET, SECRET)).toBe(true);
    expect(isValidSecret(SECRET.slice(0, -1) + 'x', SECRET)).toBe(false);
    expect(isValidSecret(SECRET + 'x', SECRET)).toBe(false);
    expect(isValidSecret('', '')).toBe(false);
  });
});

describe('máy chủ webhook', () => {
  const received: WebhookEvent[] = [];
  const app = buildWebhookServer({
    secretPath: SECRET,
    log: pino({ level: 'silent' }),
    onEvent: async (ev) => {
      received.push(ev);
    },
  });

  it('sai mã → 404, không xếp việc', async () => {
    const res = await app.inject({ method: 'POST', url: '/webhook/sai-ma', payload: { a: 1 } });
    expect(res.statusCode).toBe(404);
    expect(received).toHaveLength(0);
  });
  it('địa chỉ khác → 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(404);
  });
  it('đúng mã → 200 và xếp đúng nội dung', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/webhook/${SECRET}`,
      payload: { event: 'x' },
    });
    expect(res.statusCode).toBe(200);
    expect(received).toHaveLength(1);
    expect(received[0]?.body).toEqual({ event: 'x' });
  });
  it('GET đúng mã → 200 (để Pancake kiểm tra địa chỉ)', async () => {
    const res = await app.inject({ method: 'GET', url: `/webhook/${SECRET}` });
    expect(res.statusCode).toBe(200);
  });
});

describe('countConversations', () => {
  it('đếm an toàn với các dạng trả về', () => {
    expect(countConversations([1, 2])).toBe(2);
    expect(countConversations({ conversations: [1] })).toBe(1);
    expect(countConversations({ success: true })).toBe(0);
    expect(countConversations(null)).toBe(0);
  });
});
