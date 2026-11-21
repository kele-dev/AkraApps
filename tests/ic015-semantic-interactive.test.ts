import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const TARGET_FILES = [
  'src/components/Header.tsx',
  'src/features/Feed/Feed.tsx',
  'src/features/Profile/Profile.tsx',
  'src/features/Books/Books.tsx',
  'src/features/Books/BookDetails.tsx',
  'src/features/Search/Search.tsx',
];

test('no clickable non-semantic div/span/img/Star/heading elements exist in interactive views', () => {
  const forbidden = /<(div|span|img|h4|strong|p|Star)\b[^>]*\bonClick=/g;
  for (const rel of TARGET_FILES) {
    const src = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
    const matches = src.match(forbidden);
    assert.equal(
      matches,
      null,
      `${rel} still contains clickable non-semantic elements: ${matches?.join(', ')}`
    );
  }
});
