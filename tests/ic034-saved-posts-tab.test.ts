import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('Profile and ProfileActivityTabs provide Saved (Tersimpan) tab for own bookmarked posts', () => {
  const profileSrc = fs.readFileSync(path.join(root, 'src/features/Profile/Profile.tsx'), 'utf8');
  const tabsSrc = fs.readFileSync(
    path.join(root, 'src/features/Profile/ProfileActivityTabs.tsx'),
    'utf8'
  );

  assert.match(profileSrc, /'saved'/);
  assert.match(profileSrc, /savedPostIds/);
  assert.match(profileSrc, /toggleSavePost/);
  assert.match(tabsSrc, /mainTab === 'saved'/);
  assert.match(tabsSrc, /savedPosts/);
});
