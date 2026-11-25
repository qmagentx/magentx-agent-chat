// Chọn bản sao lưu giữ lại (GĐ3 mục 9.2): 24 bản gần nhất (2 ngày) + bản ~3h sáng (giờ VN) của 14 ngày gần nhất.
import { vnParts } from '../shared/time.js';

export interface BackupFileInfo {
  name: string;
  /** Thời điểm tạo bản sao lưu */
  createdAt: Date;
}

export interface RetentionPolicy {
  keepRecent: number;
  keepDailyDays: number;
  /** Giờ (VN) của bản "hằng ngày" được giữ lâu */
  dailyHour: number;
}

export const DEFAULT_RETENTION: RetentionPolicy = {
  keepRecent: 24,
  keepDailyDays: 14,
  dailyHour: 3,
};

/** Trả về danh sách file NÊN XÓA. Không bao giờ xóa bản mới nhất. */
export function chooseFilesToDelete(
  files: BackupFileInfo[],
  now: Date = new Date(),
  policy: RetentionPolicy = DEFAULT_RETENTION,
): BackupFileInfo[] {
  const sorted = [...files].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const keep = new Set<string>();
  for (const f of sorted.slice(0, policy.keepRecent)) keep.add(f.name);

  // Mỗi ngày (giờ VN) trong 14 ngày: giữ bản đầu tiên có giờ == dailyHour, nếu không có thì bản sớm nhất của ngày đó
  const limitMs = now.getTime() - policy.keepDailyDays * 24 * 3600 * 1000;
  const byDay = new Map<string, BackupFileInfo[]>();
  for (const f of sorted) {
    if (f.createdAt.getTime() < limitMs) continue;
    const p = vnParts(f.createdAt);
    const key = `${p.year}-${p.month}-${p.day}`;
    const list = byDay.get(key) ?? [];
    list.push(f);
    byDay.set(key, list);
  }
  for (const list of byDay.values()) {
    const atHour = list.filter((f) => vnParts(f.createdAt).hour === policy.dailyHour);
    const pick = (atHour.length ? atHour : list).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    )[0];
    if (pick) keep.add(pick.name);
  }
  return sorted.filter((f) => !keep.has(f.name));
}

/** Tên file: magentx_test_2026-11-25_2300.sql.gz.enc → thời điểm tạo (giờ VN) */
export function parseBackupName(name: string): Date | null {
  const m = /_(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})\.sql\.gz\.enc$/.exec(name);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:00+07:00`);
}
