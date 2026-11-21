import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Modal component implements accessible dialog semantics and Feed/Profile use it', () => {
  const modalPath = path.join(process.cwd(), 'src/components/Modal.tsx');
  assert.equal(fs.existsSync(modalPath), true, 'src/components/Modal.tsx must exist');
  const modalSrc = fs.readFileSync(modalPath, 'utf8');
  assert.match(modalSrc, /role="dialog"/);
  assert.match(modalSrc, /aria-modal="true"/);
  assert.match(modalSrc, /Escape/);

  const feedSrc = fs.readFileSync(path.join(process.cwd(), 'src/features/Feed/Feed.tsx'), 'utf8');
  assert.match(feedSrc, /<Modal\b/);

  const profileSrc = fs.readFileSync(path.join(process.cwd(), 'src/features/Profile/Profile.tsx'), 'utf8');
  assert.match(profileSrc, /<Modal\b/);
});
