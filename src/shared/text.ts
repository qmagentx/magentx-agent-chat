// Hàm xử lý chữ dùng chung: chuẩn hóa tiếng Việt, che số điện thoại, làm sạch chữ cho Telegram.

/** Chuẩn hóa chữ tiếng Việt về dạng NFC để so sánh tên cột, tên tab, giá trị dropdown. */
export function nfc(text: string): string {
  return text.normalize('NFC');
}

/**
 * Số điện thoại Việt Nam: bắt đầu bằng 0 hoặc +84/84, tổng 10 chữ số,
 * có thể chen dấu cách, chấm, gạch giữa các số.
 */
const PHONE_REGEX = /(?<![\d\p{L}])(?:\+?84|0)(?:[\s.-]?\d){9}(?![\d\p{L}])/gu;

/** Thay mọi số điện thoại trong chữ bằng [SĐT]. Dùng trước khi ghi log hay gửi cho AI. */
export function maskPhones(text: string): string {
  return text.replace(PHONE_REGEX, '[SĐT]');
}

/** Có số điện thoại trong chữ không. */
export function containsPhone(text: string): boolean {
  PHONE_REGEX.lastIndex = 0;
  return PHONE_REGEX.test(text);
}

/**
 * Làm sạch chữ của khách/Sheet trước khi chèn vào tin Telegram định dạng HTML.
 * Telegram chỉ cần thoát 3 ký tự: & < >
 */
export function escapeTelegramHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Cắt chữ còn tối đa `max` ký tự, thêm "…" nếu bị cắt. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}
