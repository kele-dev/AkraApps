import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('error.tsx and global-error.tsx boundaries exist with retry handler', () => {
  const errSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/error.tsx'), 'utf8');
  const globalErrSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/global-error.tsx'), 'utf8');
  assert.match(errSrc, /unstable_retry/);
  assert.match(globalErrSrc, /unstable_retry/);
});
