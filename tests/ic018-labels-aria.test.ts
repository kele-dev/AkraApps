import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('key form controls and icon-only buttons have aria-label or htmlFor association', () => {
  const header = fs.readFileSync(path.join(process.cwd(), 'src/components/Header.tsx'), 'utf8');
  assert.match(header, /<input[\s\S]*?aria-label=/);
  assert.match(header, /aria-label=[^>]*>[\s\S]*?<Bell/);

  const feed = fs.readFileSync(path.join(process.cwd(), 'src/features/Feed/Feed.tsx'), 'utf8');
  assert.match(feed, /htmlFor="story-content-input"/);
  assert.match(feed, /id="story-content-input"/);
  assert.match(feed, /htmlFor="story-book-select"/);
  assert.match(feed, /id="story-book-select"/);

  const profile = fs.readFileSync(path.join(process.cwd(), 'src/features/Profile/Profile.tsx'), 'utf8');
  assert.match(profile, /htmlFor=\{`edit-field-\$\{field\.id\}`\}/);
  assert.match(profile, /htmlFor="edit-profile-bio"/);
  assert.match(profile, /htmlFor="edit-profile-gender"/);
  assert.match(profile, /htmlFor="quick-progress-range"/);
  assert.match(profile, /htmlFor="quick-progress-note"/);
});
