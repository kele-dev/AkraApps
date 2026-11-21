import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function listTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTsxFiles(full));
    else if (entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

test('no invalid Tailwind utility classes remain and design tokens exist in globals.css', () => {
  const invalidUtilities = [
    /\bcolor-brand-orange\b/,
    /\bresize-vertical\b/,
    /\bbackground-transparent\b/,
    /\bshadow-3xs\b/,
  ];

  for (const file of listTsxFiles(path.join(process.cwd(), 'src'))) {
    const src = fs.readFileSync(file, 'utf8');
    for (const re of invalidUtilities) {
      assert.doesNotMatch(src, re, `${file} contains invalid utility ${re}`);
    }
  }

  const css = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8');
  assert.match(css, /--color-brand-forest:/);
  assert.match(css, /--color-surface-parchment:/);
});
