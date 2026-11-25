import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import { afterAll, describe, expect, it } from 'vitest';
import { decryptFileToStream, encryptStreamToFile } from '../src/backup/crypto.js';
import { chooseFilesToDelete, parseBackupName } from '../src/backup/retention.js';
import { backupFileName } from '../src/backup/backup.js';
import { withCredentials } from '../src/backup/pg.js';

const dir = mkdtempSync(join(tmpdir(), 'mgx-backup-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

async function collect(stream: PassThrough): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  return Buffer.concat(chunks);
}

describe('mã hóa bản sao lưu', () => {
  it('mã hóa rồi giải mã đúng mật khẩu → dữ liệu y nguyên', async () => {
    const data = Buffer.from('Dữ liệu sao lưu thử – tiếng Việt có dấu 1.990.000đ');
    const out = join(dir, 'a.sql.gz.enc');
    await encryptStreamToFile(Readable.from([data]), out, 'mat-khau-rat-dai-123');
    expect(readFileSync(out).subarray(0, 6).toString()).toBe('MGXBK1');
    const sink = new PassThrough();
    const done = collect(sink);
    await decryptFileToStream(out, sink, 'mat-khau-rat-dai-123');
    expect((await done).toString()).toBe(data.toString());
  });
  it('sai mật khẩu → báo lỗi, không trả dữ liệu rác', async () => {
    const out = join(dir, 'b.sql.gz.enc');
    await encryptStreamToFile(Readable.from([Buffer.from('abc')]), out, 'mat-khau-dung-123456');
    await expect(
      decryptFileToStream(out, new PassThrough(), 'mat-khau-sai-1234567'),
    ).rejects.toThrow();
  });
  it('file lạ → báo lỗi thiếu đầu MGXBK1', async () => {
    const out = join(dir, 'c.sql.gz.enc');
    writeFileSync(out, Buffer.alloc(100, 1));
    await expect(decryptFileToStream(out, new PassThrough(), 'x'.repeat(12))).rejects.toThrow(
      /MGXBK1/,
    );
  });
});

describe('quy tắc giữ bản sao lưu', () => {
  it('tên file ↔ thời điểm (giờ VN)', () => {
    expect(backupFileName('magentx_test', new Date('2026-11-25T16:39:00Z'))).toBe(
      'magentx_test_2026-11-25_2339.sql.gz.enc',
    );
    expect(parseBackupName('magentx_test_2026-11-25_2339.sql.gz.enc')?.toISOString()).toBe(
      '2026-11-25T16:39:00.000Z',
    );
    expect(parseBackupName('khac.txt')).toBeNull();
  });
  it('giữ 24 bản gần nhất + bản 3h sáng 14 ngày, xóa phần còn lại', () => {
    const now = new Date('2026-11-25T10:00:00+07:00');
    const files = [];
    // 20 ngày, mỗi ngày 12 bản cách 2 giờ (01,03,05,…,23h)
    for (let d = 0; d < 20; d++) {
      for (let h = 1; h < 24; h += 2) {
        const at = new Date(now.getTime() - d * 86400000);
        at.setUTCHours(h - 7, 0, 0, 0); // giờ VN h → UTC
        if (at > now) continue;
        files.push({ name: backupFileName('db', at), createdAt: at });
      }
    }
    const del = chooseFilesToDelete(files, now);
    const keep = files.filter((f) => !del.includes(f));
    const recent = [...files]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 24);
    for (const f of recent) expect(keep).toContain(f); // 24 bản gần nhất còn
    const old3h = files.filter(
      (f) =>
        f.name.endsWith('_0300.sql.gz.enc') &&
        now.getTime() - f.createdAt.getTime() <= 14 * 86400000,
    );
    for (const f of old3h) expect(keep).toContain(f); // bản 3h sáng trong 14 ngày còn
    const veryOld = files.filter((f) => now.getTime() - f.createdAt.getTime() > 15 * 86400000);
    for (const f of veryOld) expect(del).toContain(f); // quá 15 ngày bị xóa
  });
});

describe('withCredentials', () => {
  it('đổi tài khoản và database, giữ máy chủ', () => {
    expect(
      withCredentials('postgresql://bot_app:mk@localhost:5432/magentx_test', {
        user: 'backup_reader',
        password: '',
        database: 'tam',
      }),
    ).toBe('postgresql://backup_reader@localhost:5432/tam');
  });
});
