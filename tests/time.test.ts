import { describe, expect, it } from 'vitest';
import {
  formatVn,
  isWithinVnHours,
  vnDateKey,
  vnDayStartUtc,
  vnParts,
} from '../src/shared/time.js';

describe('giờ Việt Nam', () => {
  // 23:30 UTC ngày 24/11 = 06:30 ngày 25/11 giờ Việt Nam
  const t = new Date('2026-11-24T23:30:00Z');

  it('vnParts đổi sang GMT+7', () => {
    const p = vnParts(t);
    expect([p.day, p.month, p.year, p.hour, p.minute]).toEqual([25, 11, 2026, 6, 30]);
  });
  it('vnDateKey lấy ngày theo giờ Việt Nam', () => {
    expect(vnDateKey(t)).toBe('2026-11-25');
  });
  it('formatVn hiển thị HH:mm dd/MM/yyyy', () => {
    expect(formatVn(t)).toBe('06:30 25/11/2026');
  });
  it('vnDayStartUtc là 17:00 UTC ngày trước', () => {
    expect(vnDayStartUtc(t).toISOString()).toBe('2026-11-24T17:00:00.000Z');
  });
  it('isWithinVnHours với giờ trực 8–22', () => {
    expect(isWithinVnHours(8, 22, t)).toBe(false); // 6h30 sáng
    expect(isWithinVnHours(8, 22, new Date('2026-11-25T03:00:00Z'))).toBe(true); // 10h
    expect(isWithinVnHours(22, 8, t)).toBe(true); // giờ im lặng qua đêm
  });
});
