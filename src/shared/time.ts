// Thời gian: lưu UTC, nhưng "một ngày", giờ trực, giờ im lặng tính theo giờ Việt Nam (GMT+7).

export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

export interface VnParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = Chủ nhật … 6 = Thứ bảy */
  weekday: number;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Tách một mốc thời gian ra năm/tháng/ngày/giờ… theo giờ Việt Nam. */
export function vnParts(date: Date = new Date()): VnParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: VN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  });
  const parts: Record<string, string> = {};
  for (const p of formatter.formatToParts(date)) parts[p.type] = p.value;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAY_INDEX[parts.weekday ?? ''] ?? 0,
  };
}

const pad2 = (n: number): string => n.toString().padStart(2, '0');

/** Khóa ngày theo giờ Việt Nam, dạng 2026-11-24. Dùng để đếm "hôm nay". */
export function vnDateKey(date: Date = new Date()): string {
  const p = vnParts(date);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

/** Hiển thị cho người đọc: 08:05 24/11/2026 */
export function formatVn(date: Date = new Date()): string {
  const p = vnParts(date);
  return `${pad2(p.hour)}:${pad2(p.minute)} ${pad2(p.day)}/${pad2(p.month)}/${p.year}`;
}

/** Mốc UTC của 0h00 giờ Việt Nam của ngày chứa `date`. */
export function vnDayStartUtc(date: Date = new Date()): Date {
  return new Date(`${vnDateKey(date)}T00:00:00+07:00`);
}

/** Đang trong khung giờ [startHour, endHour) theo giờ Việt Nam không (vd giờ trực 8–22). */
export function isWithinVnHours(
  startHour: number,
  endHour: number,
  date: Date = new Date(),
): boolean {
  const { hour } = vnParts(date);
  if (startHour <= endHour) return hour >= startHour && hour < endHour;
  // Khung qua đêm, vd 22 → 8
  return hour >= startHour || hour < endHour;
}
