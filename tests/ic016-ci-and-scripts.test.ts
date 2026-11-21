import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('package.json defines typecheck and test scripts and CI workflow exists', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  assert.ok(pkg.scripts?.typecheck, 'typecheck script must exist');
  assert.ok(pkg.scripts?.test, 'test script must exist');

  const ciPath = path.join(process.cwd(), '.github/workflows/ci.yml');
  assert.equal(fs.existsSync(ciPath), true, '.github/workflows/ci.yml must exist');
  const ci = fs.readFileSync(ciPath, 'utf8');
  assert.match(ci, /npm ci/);
  assert.match(ci, /npm run lint/);
  assert.match(ci, /npm run typecheck/);
  assert.match(ci, /npm run build/);
});
