import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Feed empty state, Profile empty shelf state, and deep-link book sharing exist', () => {
  const feedSrc = fs.readFileSync(path.join(process.cwd(), 'src/features/Feed/Feed.tsx'), 'utf8');
  assert.match(feedSrc, /filteredFeedPosts\.length\s*===\s*0/);

  const profileSrc = fs.readFileSync(path.join(process.cwd(), 'src/features/Profile/Profile.tsx'), 'utf8');
  assert.match(profileSrc, /isExpanded\s*&&\s*\(\s*shelfBooks\.length\s*===\s*0/);

  const detailsSrc = fs.readFileSync(path.join(process.cwd(), 'src/features/Books/BookDetails.tsx'), 'utf8');
  assert.match(detailsSrc, /\?book=/);

  const ctxSrc = fs.readFileSync(path.join(process.cwd(), 'src/context/AppContext.tsx'), 'utf8');
  assert.match(ctxSrc, /searchParams\.get\('book'\)/);
});
