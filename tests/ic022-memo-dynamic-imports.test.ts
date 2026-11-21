import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('page.tsx lazy-loads tab modules with next/dynamic and AppContext memoizes provider value', () => {
  const pageSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/page.tsx'), 'utf8');
  assert.match(pageSrc, /from\s+['"]next\/dynamic['"]/);
  assert.match(pageSrc, /dynamic\(/);

  const ctxSrc = fs.readFileSync(path.join(process.cwd(), 'src/context/AppContext.tsx'), 'utf8');
  assert.match(ctxSrc, /useMemo\s*\(/);
});
