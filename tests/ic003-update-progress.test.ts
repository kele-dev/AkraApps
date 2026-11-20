import test from 'node:test';
import assert from 'node:assert/strict';
import { computeProgressTransition } from '../src/lib/progressUtils.ts';

test('computeProgressTransition clamps pages and marks newly completed once', () => {
  const books = [
    { id: 'b1', title: 'Book 1', author: 'Author', coverImage: '', totalPages: 200 },
  ];

  const first = computeProgressTransition({
    prevProgress: [],
    books,
    userId: 'u1',
    bookId: 'b1',
    page: 250,
    status: 'READING',
    rating: 5,
    idFactory: () => 'p_1',
    nowIso: () => '2026-11-20T00:00:00.000Z',
  });

  assert.equal(first.finalPage, 200);
  assert.equal(first.finalStatus, 'COMPLETED');
  assert.equal(first.didNewlyComplete, true);
  assert.equal(first.nextProgressList.length, 1);

  const second = computeProgressTransition({
    prevProgress: first.nextProgressList,
    books,
    userId: 'u1',
    bookId: 'b1',
    page: -10,
    status: 'COMPLETED',
    idFactory: () => 'p_2',
    nowIso: () => '2026-11-20T00:01:00.000Z',
  });

  assert.equal(second.finalPage, 200);
  assert.equal(second.finalStatus, 'COMPLETED');
  assert.equal(second.didNewlyComplete, false);
});
