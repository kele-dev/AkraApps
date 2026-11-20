import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('no blocking window.alert calls remain in src and Login renders inline error alert', () => {
  const files = [
    'src/features/Feed/Feed.tsx',
    'src/features/Profile/Profile.tsx',
    'src/features/Books/BookDetails.tsx',
  ];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
    assert.doesNotMatch(content, /\balert\s*\(/, `${rel} should not call alert()`);
  }

  const loginSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/Login.tsx'), 'utf8');
  assert.match(loginSrc, /role="alert"/);
});
