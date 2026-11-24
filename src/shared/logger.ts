// Ghi log. Mọi chuỗi đi qua đây đều được che số điện thoại; các khóa có tên nhạy cảm bị ẩn.
import pino, { type Logger, type LoggerOptions } from 'pino';
import type { Writable } from 'node:stream';
import { maskPhones } from './text.js';

/** Tên trường có thể chứa bí mật → thay bằng [ẨN]. */
const SECRET_KEY_REGEX = /token|secret|password|passwd|api[_-]?key|authorization|cookie|private/i;

const MAX_DEPTH = 8;

/** Che SĐT trong mọi chuỗi và ẩn giá trị của các trường nhạy cảm, đến mọi tầng của đối tượng. */
export function maskDeep(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[quá sâu]';
  if (typeof value === 'string') return maskPhones(value);
  if (Array.isArray(value)) return value.map((v) => maskDeep(v, depth + 1));
  if (value instanceof Error) {
    return {
      type: value.name,
      message: maskPhones(value.message),
      stack: value.stack ? maskPhones(value.stack) : undefined,
    };
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      out[key] = SECRET_KEY_REGEX.test(key) ? '[ẨN]' : maskDeep(v, depth + 1);
    }
    return out;
  }
  return value;
}

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  /** In đẹp, có màu, cho lúc chạy trên máy. */
  pretty: boolean;
  /** Dòng ghi tùy chọn (dùng trong kiểm thử). Khi có, bỏ qua `pretty`. */
  destination?: Writable;
}

export function createLogger(config: LoggerConfig): Logger {
  const options: LoggerOptions = {
    level: config.level,
    hooks: {
      logMethod(args, method) {
        const masked = args.map((a) => maskDeep(a)) as Parameters<typeof method>;
        method.apply(this, masked);
      },
    },
  };

  if (config.destination) return pino(options, config.destination);

  if (config.pretty) {
    options.transport = {
      target: 'pino-pretty',
      options: { translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname', singleLine: false },
    };
  }
  return pino(options);
}
