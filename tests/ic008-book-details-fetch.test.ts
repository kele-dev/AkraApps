import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveUserBookRating } from '../src/lib/bookRating.ts';

test('resolveUserBookRating returns actual progress rating without forcing 5', () => {
  assert.equal(resolveUserBookRating({ status: 'COMPLETED', rating: 3 }), 3);
  assert.equal(resolveUserBookRating({ status: 'COMPLETED', rating: undefined }), 0);
  assert.equal(resolveUserBookRating({ status: 'READING', rating: 4 }), 4);
  assert.equal(resolveUserBookRating(undefined), 0);
});

test('BookDetails fetch effect depends only on selectedBook and runs parallel fetches', () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), 'src/features/Books/BookDetails.tsx'),
    'utf8'
  );
  assert.doesNotMatch(src, /\},\s*\[selectedBook,\s*readingProgress/);
  assert.match(src, /Promise\.all/);
});
