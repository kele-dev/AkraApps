import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('docs/OPERATIONS.md runbook exists with Firebase deploy/backup/rollback sections and README links it', () => {
  const opsPath = path.join(root, 'docs/OPERATIONS.md');
  assert.equal(fs.existsSync(opsPath), true, 'docs/OPERATIONS.md must exist');

  const ops = fs.readFileSync(opsPath, 'utf8');
  assert.match(ops, /firestore\.rules/i);
  assert.match(ops, /backup|export/i);
  assert.match(ops, /rollback/i);
  assert.match(ops, /\/api\/health/);

  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /OPERATIONS\.md/);
});
