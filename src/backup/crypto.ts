// Mã hóa/giải mã bản sao lưu bằng mật khẩu (AES-256-GCM, khóa rút từ mật khẩu bằng scrypt).
// Định dạng file: "MGXBK1" (6 byte) + salt (16) + iv (12) + dữ liệu mã hóa + thẻ xác thực (16, cuối file).
// Sai mật khẩu hoặc file bị sửa → giải mã báo lỗi, không trả về dữ liệu rác.
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { createReadStream, createWriteStream, promises as fsp } from 'node:fs';
import type { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export const MAGIC = Buffer.from('MGXBK1', 'ascii');
const SALT_LEN = 16;
const IV_LEN = 12;
const TAG_LEN = 16;
const HEADER_LEN = MAGIC.length + SALT_LEN + IV_LEN;

function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, 32, { N: 2 ** 15, r: 8, p: 1, maxmem: 128 * 1024 * 1024 });
}

/** Mã hóa một dòng dữ liệu (vd pg_dump đã nén) ra file `outPath`. */
export async function encryptStreamToFile(
  source: Readable,
  outPath: string,
  password: string,
): Promise<void> {
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(password, salt), iv);
  const out = createWriteStream(outPath);
  await new Promise<void>((resolve, reject) => {
    out.write(Buffer.concat([MAGIC, salt, iv]), (err) => (err ? reject(err) : resolve()));
  });
  await pipeline(source, cipher, out);
  await fsp.appendFile(outPath, cipher.getAuthTag());
}

/** Giải mã file sao lưu, ghi dữ liệu gốc (vẫn còn nén gzip) vào `dest`. */
export async function decryptFileToStream(
  inPath: string,
  dest: Writable,
  password: string,
): Promise<void> {
  const { size } = await fsp.stat(inPath);
  if (size < HEADER_LEN + TAG_LEN) throw new Error('File sao lưu quá ngắn hoặc hỏng');
  const fh = await fsp.open(inPath, 'r');
  const header = Buffer.alloc(HEADER_LEN);
  const tag = Buffer.alloc(TAG_LEN);
  try {
    await fh.read(header, 0, HEADER_LEN, 0);
    await fh.read(tag, 0, TAG_LEN, size - TAG_LEN);
  } finally {
    await fh.close();
  }
  if (!header.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error('Không phải file sao lưu của MagentX (thiếu đầu MGXBK1)');
  }
  const salt = header.subarray(MAGIC.length, MAGIC.length + SALT_LEN);
  const iv = header.subarray(MAGIC.length + SALT_LEN, HEADER_LEN);
  const decipher = createDecipheriv('aes-256-gcm', deriveKey(password, salt), iv);
  decipher.setAuthTag(tag);
  const body = createReadStream(inPath, { start: HEADER_LEN, end: size - TAG_LEN - 1 });
  await pipeline(body, decipher, dest);
}
