import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listSourceFiles(full));
    else if (/\.(ts|tsx|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

test('no unreplaced outline:none or focus:outline-none exists in src and :focus-visible is styled', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8');
  assert.match(css, /:focus-visible/);
  assert.doesNotMatch(css, /outline:\s*none/);

  for (const file of listSourceFiles(path.join(process.cwd(), 'src'))) {
    const text = fs.readFileSync(file, 'utf8');
    assert.equal(
      text.includes('focus:outline-none'),
      false,
      `${file} should not strip focus outline with focus:outline-none`
    );
  }
});
