import { describe, expect, it } from 'vitest';
import {
  containsPhone,
  escapeTelegramHtml,
  maskPhones,
  nfc,
  truncate,
} from '../src/shared/text.js';

describe('maskPhones – che số điện thoại', () => {
  it('che số 10 chữ số bắt đầu bằng 0', () => {
    expect(maskPhones('sđt em là 0912345678 nhé')).toBe('sđt em là [SĐT] nhé');
  });
  it('che số có +84 và dấu cách/chấm', () => {
    expect(maskPhones('gọi +84 912 345 678 hoặc 0912.345.678')).toBe('gọi [SĐT] hoặc [SĐT]');
  });
  it('không che mã hội thoại Facebook dài', () => {
    const id = '1234567890123456';
    expect(maskPhones(`hội thoại ${id}`)).toBe(`hội thoại ${id}`);
  });
  it('không che số tiền', () => {
    expect(maskPhones('giá 1.990.000đ')).toBe('giá 1.990.000đ');
  });
  it('containsPhone nhận ra có/không', () => {
    expect(containsPhone('0987654321')).toBe(true);
    expect(containsPhone('không có số')).toBe(false);
  });
});

describe('chữ tiếng Việt và Telegram', () => {
  it('nfc gộp dấu tổ hợp', () => {
    const nfd = 'é'; // e + dấu sắc rời
    expect(nfc(nfd)).toBe('é');
  });
  it('escapeTelegramHtml thoát & < >', () => {
    expect(escapeTelegramHtml('<b>A & B</b>')).toBe('&lt;b&gt;A &amp; B&lt;/b&gt;');
  });
  it('truncate cắt và thêm …', () => {
    expect(truncate('xin chào các bạn', 8)).toBe('xin chà…');
    expect(truncate('ngắn', 10)).toBe('ngắn');
  });
});
