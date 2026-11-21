import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { extractEditionMetadata } from '../src/lib/editionMetadata.ts';

test('extractEditionMetadata extracts real ISBN-13, ISBN-10, publisher, and language codes', () => {
  const meta = extractEditionMetadata([
    {
      isbn_13: ['9780143127741'],
      isbn_10: ['0143127748'],
      publishers: ['Penguin Books'],
      languages: [{ key: '/languages/eng' }],
    },
  ]);

  assert.equal(meta.isbn13, '9780143127741');
  assert.equal(meta.isbn10, '0143127748');
  assert.equal(meta.publisher, 'Penguin Books');
  assert.equal(meta.languageLabel, 'English');
});

test('BookDetails no longer renders hardcoded dummy ISBN/Characters/Setting rows', () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), 'src/features/Books/BookDetails.tsx'),
    'utf8'
  );
  assert.doesNotMatch(src, /9789792261882/);
  assert.doesNotMatch(src, /Tanya, Dede, Ibu, Danar/);
  assert.doesNotMatch(src, /Gramedia Pustaka Utama/);
  assert.match(src, /extractEditionMetadata/);
});
