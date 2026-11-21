import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canDeletePost,
  filterOwnedRecordsForSync,
} from '../src/lib/firestoreSync.ts';

test('canDeletePost allows owner and blocks non-owner or missing post', () => {
  const post = { id: 'p1', userId: 'u1' };
  assert.equal(canDeletePost(post, 'u1'), true);
  assert.equal(canDeletePost(post, 'u2'), false);
  assert.equal(canDeletePost(post, 'guest'), false);
  assert.equal(canDeletePost(undefined, 'u1'), false);
});

test('filterOwnedRecordsForSync excludes other users progress, goals, and posts', () => {
  const result = filterOwnedRecordsForSync('u1', {
    readingProgress: [
      { id: 'pr1', userId: 'u1', bookId: 'b1', currentPage: 10, status: 'READING', updatedAt: '2026-01-01' },
      { id: 'pr2', userId: 'u2', bookId: 'b1', currentPage: 20, status: 'READING', updatedAt: '2026-01-01' },
    ],
    goals: [
      { userId: 'u1', year: 2026, targetBooks: 10, completedBooksCount: 1 },
      { userId: 'u2', year: 2026, targetBooks: 5, completedBooksCount: 2 },
    ],
    posts: [
      { id: 'post1', userId: 'u1', userDisplayName: 'A', userAvatar: '', type: 'QUOTE', content: 'hi', likes: [], comments: [], createdAt: '2026-01-01' },
      { id: 'post2', userId: 'u2', userDisplayName: 'B', userAvatar: '', type: 'QUOTE', content: 'yo', likes: [], comments: [], createdAt: '2026-01-01' },
    ],
  });

  assert.deepEqual(result.readingProgress.map((p) => p.id), ['pr1']);
  assert.deepEqual(result.goals.map((g) => g.userId), ['u1']);
  assert.deepEqual(result.posts.map((p) => p.id), ['post1']);
});
