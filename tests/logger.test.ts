import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger, maskDeep } from '../src/shared/logger.js';

function captureStream(): { stream: Writable; lines: () => string[] } {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(chunk.toString());
      cb();
    },
  });
  return { stream, lines: () => chunks.join('').split('\n').filter(Boolean) };
}

describe('logger không để lọt SĐT và bí mật', () => {
  it('maskDeep che SĐT trong chuỗi lồng nhau và ẩn trường nhạy cảm', () => {
    const out = maskDeep({
      tin: 'em là 0912345678',
      khach: { ten: 'An', ghiChu: ['gọi 0987 654 321'] },
      pancakeToken: 'abc',
      apiKey: 'xyz',
    }) as Record<string, unknown>;
    expect(out.tin).toBe('em là [SĐT]');
    expect((out.khach as Record<string, unknown>).ghiChu).toEqual(['gọi [SĐT]']);
    expect(out.pancakeToken).toBe('[ẨN]');
    expect(out.apiKey).toBe('[ẨN]');
  });

  it('dòng log ghi ra không chứa SĐT', async () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ level: 'info', pretty: false, destination: stream });
    log.info({ noiDung: 'khách để số 0912345678' }, 'tin mới từ 0912345678');
    await new Promise((r) => setTimeout(r, 20));
    const text = lines().join('\n');
    expect(text).not.toContain('0912345678');
    expect(text).toContain('[SĐT]');
  });
});
