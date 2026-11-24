import { describe, expect, it } from 'vitest';
import { formatVnd, hasMoneyOutsidePlaceholders, listPlaceholders } from '../src/shared/money.js';

describe('formatVnd', () => {
  it('định dạng 1.990.000đ', () => {
    expect(formatVnd(1990000)).toBe('1.990.000đ');
    expect(formatVnd(500)).toBe('500đ');
    expect(formatVnd(0)).toBe('0đ');
  });
});

describe('hasMoneyOutsidePlaceholders – AI không được tự viết số tiền', () => {
  it('chỗ trống hợp lệ → được', () => {
    expect(
      hasMoneyOutsidePlaceholders('Khóa Edit hiện {gia:edit}, gốc {gia_goc:edit} bạn nhé'),
    ).toBe(false);
  });
  it('số kèm đơn vị tiền → không được', () => {
    expect(hasMoneyOutsidePlaceholders('Khóa này 1.990.000đ')).toBe(true);
    expect(hasMoneyOutsidePlaceholders('chỉ 1tr990 thôi')).toBe(true);
    expect(hasMoneyOutsidePlaceholders('giảm 20% hôm nay')).toBe(true);
    expect(hasMoneyOutsidePlaceholders('có 990k')).toBe(true);
  });
  it('dãy từ 6 chữ số (STK, giá viết trần) → không được', () => {
    expect(hasMoneyOutsidePlaceholders('chuyển vào 0011223344')).toBe(true);
    expect(hasMoneyOutsidePlaceholders('giá 1 990 000')).toBe(true);
  });
  it('số bình thường (ngày, buổi, giờ) → được', () => {
    expect(hasMoneyOutsidePlaceholders('Khóa học 12 buổi, học tối 19h30, khai giảng 25/11')).toBe(
      false,
    );
  });
  it('câu mẫu gui-stk đúng chuẩn → được', () => {
    expect(hasMoneyOutsidePlaceholders('Thông tin chuyển khoản: {thong_tin_ck:}')).toBe(false);
  });
  it('listPlaceholders liệt kê không trùng', () => {
    expect(listPlaceholders('{gia:edit} và {gia:edit} và {tiet_kiem:combo}')).toEqual([
      '{gia:edit}',
      '{tiet_kiem:combo}',
    ]);
  });
});
