import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('AppContext uses per-slice localStorage effects and writeBatch instead of sequential N+1 setDoc loops', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'src/context/AppContext.tsx'), 'utf8');
  assert.match(src, /writeBatch/);
  assert.match(src, /Promise\.all/);
  assert.doesNotMatch(src, /for\s*\(const book of books\)\s*\{\s*await setDoc/);
});
