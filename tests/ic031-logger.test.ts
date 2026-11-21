import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { formatStructuredLog, logger } from '../src/lib/logger.ts';

test('formatStructuredLog builds structured payload with level, timestamp, event, and safe error metadata', () => {
  const entry = formatStructuredLog('error', 'firestore.sync_failed', {
    scope: 'outbound',
    email: 'secret@example.com',
    error: new Error('permission-denied'),
  });

  assert.equal(entry.level, 'error');
  assert.equal(entry.event, 'firestore.sync_failed');
  assert.ok(Date.parse(entry.timestamp) > 0);
  assert.equal(entry.context.scope, 'outbound');
  assert.equal(entry.context.email, '[REDACTED]');
  assert.equal(entry.context.errorMessage, 'permission-denied');
});

test('src modules route operational logs through src/lib/logger instead of raw console.*', () => {
  assert.equal(typeof logger.warn, 'function');
  assert.equal(typeof logger.error, 'function');
  assert.equal(typeof logger.info, 'function');

  const root = process.cwd();
  const checkedFiles = [
    'src/app/error.tsx',
    'src/app/global-error.tsx',
    'src/components/Header.tsx',
    'src/components/Login.tsx',
    'src/context/AppContext.tsx',
    'src/features/Books/Books.tsx',
    'src/features/Books/BookDetails.tsx',
    'src/features/Search/Search.tsx',
    'src/lib/bookApi.ts',
    'src/lib/firebase.ts',
  ];

  for (const rel of checkedFiles) {
    const src = fs.readFileSync(path.join(root, rel), 'utf8');
    assert.doesNotMatch(src, /\bconsole\.(log|warn|error|info|debug)\s*\(/, `${rel} should use logger instead of raw console`);
  }
});
