import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeGoogleBooksItems,
  normalizeOpenLibraryDocs,
  deduplicateBookResults,
} from '../src/lib/bookSearchUtils.ts';
import { getRichBookDetail } from '../src/features/Books/bookDetailsData.ts';

test('normalizeGoogleBooksItems maps metadata and fallbacks accurately', () => {
  const results = normalizeGoogleBooksItems([
    {
      id: 'gb-1',
      volumeInfo: {
        title: 'Atomic Habits',
        authors: ['James Clear'],
        pageCount: 320,
        categories: ['Self-Help'],
        averageRating: 4.8,
        ratingsCount: 1200,
        publishedDate: '2018-10-16',
        imageLinks: { thumbnail: 'https://example.com/atomic.jpg' },
      },
    },
    {
      id: 'gb-2',
      volumeInfo: {},
    },
  ]);

  assert.equal(results.length, 2);
  assert.equal(results[0].id, 'gb-1');
  assert.equal(results[0].firstPublishYear, 2018);
  assert.equal(results[0].rating, 4.8);
  assert.equal(results[0].ratingsCount, 1200);
  assert.equal(results[1].title, 'Judul Tidak Diketahui');
  assert.equal(results[1].author, 'Penulis Tidak Diketahui');
  assert.equal(results[1].totalPages, 200);
});

test('normalizeOpenLibraryDocs maps cover URL, subjects, and ratings', () => {
  const results = normalizeOpenLibraryDocs([
    {
      key: '/works/OL1W',
      title: 'Dune',
      author_name: ['Frank Herbert'],
      cover_i: 12345,
      number_of_pages_median: 412,
      subject: ['Science Fiction'],
      ratings_average: 4.5,
      ratings_count: 500,
      first_publish_year: 1965,
    },
  ]);

  assert.equal(results.length, 1);
  assert.equal(results[0].coverImage, 'https://covers.openlibrary.org/b/id/12345-M.jpg');
  assert.equal(results[0].totalPages, 412);
  assert.equal(results[0].category, 'Science Fiction');
  assert.equal(results[0].firstPublishYear, 1965);
});

test('deduplicateBookResults removes case-insensitive title+author duplicates and honors limit', () => {
  const items = [
    { id: '1', title: 'Dune', author: 'Frank Herbert', coverImage: 'a', totalPages: 412, category: 'Sci-Fi' },
    { id: '2', title: ' dune ', author: 'frank herbert ', coverImage: 'b', totalPages: 412, category: 'Sci-Fi' },
    { id: '3', title: 'Sapiens', author: 'Yuval Noah Harari', coverImage: 'c', totalPages: 443, category: 'History' },
  ];

  const deduped = deduplicateBookResults(items, 10);
  assert.equal(deduped.length, 2);
  assert.deepEqual(deduped.map((b) => b.id), ['1', '3']);
  assert.equal(deduplicateBookResults(items, 1).length, 1);
});

test('getRichBookDetail generates valid procedural detail without syntax errors', () => {
  const detail = getRichBookDetail({
    id: 'b-test',
    title: 'Laskar Pelangi',
    author: 'Andrea Hirata',
    coverImage: '',
    totalPages: 529,
    category: 'Fiksi',
  });

  assert.equal(detail.id, 'b-test');
  assert.equal(detail.title, 'Laskar Pelangi');
  assert.ok(detail.genres.includes('Fiction'));
  assert.ok(detail.authorAvatar?.startsWith('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'));
  assert.ok(detail.description.includes('Laskar Pelangi'));
});
