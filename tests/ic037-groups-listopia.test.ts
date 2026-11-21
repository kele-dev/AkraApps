import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildListopiaRankings, buildReadingClubs } from '../src/lib/communityDiscovery.ts';

test('buildListopiaRankings ranks books by average community rating and reader count', () => {
  const books = [
    { id: 'b1', title: 'Sapiens', author: 'Harari', coverImage: '', totalPages: 400, category: 'History' },
    { id: 'b2', title: 'Dune', author: 'Herbert', coverImage: '', totalPages: 500, category: 'Sci-Fi' },
  ];
  const progress = [
    { id: 'p1', userId: 'u1', bookId: 'b1', currentPage: 400, status: 'COMPLETED' as const, rating: 4, updatedAt: '' },
    { id: 'p2', userId: 'u1', bookId: 'b2', currentPage: 500, status: 'COMPLETED' as const, rating: 5, updatedAt: '' },
    { id: 'p3', userId: 'u2', bookId: 'b2', currentPage: 200, status: 'READING' as const, rating: 5, updatedAt: '' },
  ];

  const ranked = buildListopiaRankings(books, progress);
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].book.id, 'b2');
  assert.equal(ranked[0].averageRating, 5);
  assert.equal(ranked[0].readerCount, 2);
});

test('buildReadingClubs aggregates BuddyReads by book with member profiles', () => {
  const books = [{ id: 'b1', title: 'Dune', author: 'Herbert', coverImage: '', totalPages: 500 }];
  const users = [
    { id: 'u1', username: 'a', displayName: 'Andi', avatar: '', bio: '' },
    { id: 'u2', username: 'b', displayName: 'Budi', avatar: '', bio: '' },
  ];
  const buddyReads = [{ id: 'br1', bookId: 'b1', userIds: ['u1', 'u2'], createdAt: '2026-11-20T00:00:00Z' }];

  const clubs = buildReadingClubs(buddyReads, books, users);
  assert.equal(clubs.length, 1);
  assert.equal(clubs[0].book.id, 'b1');
  assert.equal(clubs[0].members.length, 2);
});

test('SearchPage renders interactive Grup and Listopia tabs instead of under-development stub', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'src/features/Search/Search.tsx'), 'utf8');
  assert.doesNotMatch(src, /sedang dikembangkan/);
  assert.match(src, /buildListopiaRankings/);
  assert.match(src, /buildReadingClubs/);
});
