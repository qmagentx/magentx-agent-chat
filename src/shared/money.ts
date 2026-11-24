// Tiền: định dạng hiển thị và kiểm tra "AI có tự viết số tiền ngoài chỗ trống không".

/** Chỗ trống giá hợp lệ do code điền từ Sheet, ví dụ {gia:edit} {gia_goc:ai} {tiet_kiem:combo}. */
export const PLACEHOLDER_REGEX =
  /\{(gia|gia_goc|tiet_kiem|phan_tram_giam|han_uu_dai|gia_combo|thong_tin_ck):[a-z0-9_-]*\}/g;

/** Mọi cặp ngoặc nhọn {…}, kể cả chỗ trống sai tên – để loại khỏi phần kiểm tra số. */
const ANY_BRACE_REGEX = /\{[^{}]*\}/g;

/** 1990000 → "1.990.000đ". Tiền là số nguyên VND. */
export function formatVnd(amount: number): string {
  if (!Number.isFinite(amount)) throw new Error(`Số tiền không hợp lệ: ${String(amount)}`);
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${digits}đ`;
}

/** Đơn vị tiền/phần trăm mà AI không được tự viết kèm con số. */
const MONEY_UNIT_REGEX =
  /\d+(?:[.,]\d+)*\s*(?:k|nghìn|ngàn|tr|triệu|đ|đồng|vnd|vnđ|%)(?:\d{1,3})?(?![\p{L}\d])/giu;

/**
 * Có số tiền (hoặc dãy ≥6 chữ số, hoặc số kèm đơn vị tiền/%) nằm NGOÀI chỗ trống không.
 * Dùng cho cả câu trả lời AI và câu mẫu trong Sheet (đặc biệt `gui-stk`).
 * true = không hợp lệ.
 */
export function hasMoneyOutsidePlaceholders(text: string): boolean {
  const stripped = text.replace(ANY_BRACE_REGEX, ' ');

  // Dãy chữ số (cho phép chen dấu chấm/phẩy/cách) có từ 6 chữ số trở lên
  for (const run of stripped.match(/\d(?:[\d.,\s]*\d)?/g) ?? []) {
    if (run.replace(/\D/g, '').length >= 6) return true;
  }

  MONEY_UNIT_REGEX.lastIndex = 0;
  return MONEY_UNIT_REGEX.test(stripped);
}

/** Danh sách chỗ trống xuất hiện trong chữ (không trùng). */
export function listPlaceholders(text: string): string[] {
  return [...new Set(text.match(PLACEHOLDER_REGEX) ?? [])];
}
