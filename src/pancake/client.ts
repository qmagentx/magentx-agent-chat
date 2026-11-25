// Gọi API công khai của Pancake cho MỘT trang. Tối thiểu cho GĐ5 (phép thử); mở rộng ở GĐ6.
// LƯU Ý: đường dẫn/tham số dưới đây lấy theo tài liệu API công khai Pancake; phép thử A1–A12 ở GĐ5
// sẽ xác minh từng cái và sửa tại MỘT chỗ này nếu khác.
// Token chỉ nằm trong query string khi gọi; KHÔNG ghi URL đầy đủ vào log.
import type { Logger } from 'pino';

export class PancakeApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly bodyText: string,
  ) {
    super(`Pancake API trả lỗi ${status} tại ${path}`);
    this.name = 'PancakeApiError';
  }
}

export interface PancakeClientOptions {
  pageId: string;
  accessToken: string;
  log: Logger;
  baseUrl?: string;
  timeoutMs?: number;
}

interface RequestOptions {
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}

export class PancakeClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly opts: PancakeClientOptions) {
    this.baseUrl = opts.baseUrl ?? 'https://pages.fm/api/public_api/v1';
    this.timeoutMs = opts.timeoutMs ?? 15_000;
  }

  get pageId(): string {
    return this.opts.pageId;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    ro: RequestOptions = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/pages/${encodeURIComponent(this.opts.pageId)}${path}`);
    url.searchParams.set('page_access_token', this.opts.accessToken);
    for (const [k, v] of Object.entries(ro.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
    const started = Date.now();
    const res = await fetch(url, {
      method,
      headers: ro.body ? { 'content-type': 'application/json' } : undefined,
      body: ro.body ? JSON.stringify(ro.body) : undefined,
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const text = await res.text();
    this.opts.log.debug(
      { method, path, status: res.status, ms: Date.now() - started },
      'Pancake API',
    );
    if (!res.ok) throw new PancakeApiError(res.status, path, text.slice(0, 500));
    return (text ? JSON.parse(text) : {}) as T;
  }

  /** Danh sách hội thoại (60/lần theo GĐ2). since/until tính bằng giây Unix. */
  listConversations(
    params: {
      sinceSec?: number;
      untilSec?: number;
      pageNumber?: number;
      tags?: string[];
    } = {},
  ): Promise<unknown> {
    return this.request('GET', '/conversations', {
      query: {
        since: params.sinceSec,
        until: params.untilSec,
        page_number: params.pageNumber,
        tags: params.tags?.join(','),
      },
    });
  }

  /** Tin nhắn của một hội thoại (30/lần theo GĐ2). */
  getMessages(conversationId: string, customerId?: string): Promise<unknown> {
    return this.request('GET', `/conversations/${encodeURIComponent(conversationId)}/messages`, {
      query: { customer_id: customerId },
    });
  }

  /** Danh sách tag của trang. */
  listTags(): Promise<unknown> {
    return this.request('GET', '/tags');
  }

  /** Gửi tin chữ vào hội thoại (dùng trong phép thử; luồng thật ở GĐ6 phải "ghi trước, gửi sau"). */
  sendText(conversationId: string, text: string): Promise<unknown> {
    return this.request('POST', `/conversations/${encodeURIComponent(conversationId)}/messages`, {
      body: { action: 'reply_inbox', message: text },
    });
  }
}
