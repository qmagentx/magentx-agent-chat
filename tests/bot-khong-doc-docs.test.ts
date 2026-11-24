// Bảo đảm mã bot (src/) không mở file trong docs/ hay CLAUDE.md. Bot chỉ được đọc prompts/.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else if (/\.(ts|js|json)$/.test(name)) out.push(full);
  }
  return out;
}

// Chuỗi trong dấu nháy có chứa đường dẫn docs/ hoặc CLAUDE.md
const FORBIDDEN = /(['"`])[^'"`\n]*(?:(?:^|\/)docs\/|CLAUDE\.md)[^'"`\n]*\1/;

describe('bot không đọc docs/ và CLAUDE.md', () => {
  it('không file nào trong src/ trỏ tới docs/ hay CLAUDE.md', () => {
    const viPham = listFiles('src').filter((f) => FORBIDDEN.test(readFileSync(f, 'utf8')));
    expect(viPham).toEqual([]);
  });
});
