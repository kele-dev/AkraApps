import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  FIRESTORE_QUERY_LIMITS,
  filterOwnedRecordsForSync,
} from '../src/lib/firestoreSync.ts';
import { createNotificationRecord } from '../src/lib/notificationUtils.ts';

test('createNotificationRecord builds notification payloads and skips self-notifications when inappropriate', () => {
  const likeNotif = createNotificationRecord({
    recipientUserId: 'user-2',
    actor: { id: 'user-1', displayName: 'Budi', avatar: 'a.jpg' },
    type: 'LIKE',
    message: 'menyukai postingan Anda.',
    postId: 'post-1',
  });
  assert.ok(likeNotif);
  assert.equal(likeNotif.userId, 'user-2');
  assert.equal(likeNotif.fromUserId, 'user-1');
  assert.equal(likeNotif.isRead, false);

  const selfLike = createNotificationRecord({
    recipientUserId: 'user-1',
    actor: { id: 'user-1', displayName: 'Budi', avatar: 'a.jpg' },
    type: 'LIKE',
    message: 'menyukai postingan Anda.',
  });
  assert.equal(selfLike, null);
});

test('firestoreSync covers social collections and Header handles notification click navigation', () => {
  assert.ok(FIRESTORE_QUERY_LIMITS.stories > 0);
  assert.ok(FIRESTORE_QUERY_LIMITS.shelves > 0);
  assert.ok(FIRESTORE_QUERY_LIMITS.buddyReads > 0);
  assert.ok(FIRESTORE_QUERY_LIMITS.buddyMessages > 0);
  assert.ok(FIRESTORE_QUERY_LIMITS.notifications > 0);

  const owned = filterOwnedRecordsForSync('u1', {
    readingProgress: [],
    goals: [],
    posts: [],
    stories: [{ id: 's1', userId: 'u1' }, { id: 's2', userId: 'u2' }],
    shelves: [{ id: 'sh1', userId: 'u1' }, { id: 'sh2', userId: 'u2' }],
    buddyReads: [{ id: 'br1', userIds: ['u1', 'u2'] }, { id: 'br2', userIds: ['u2', 'u3'] }],
    buddyMessages: [{ id: 'bm1', userId: 'u1' }, { id: 'bm2', userId: 'u2' }],
    notifications: [
      { id: 'n1', userId: 'u1', fromUserId: 'u2' },
      { id: 'n2', userId: 'u2', fromUserId: 'u1' },
      { id: 'n3', userId: 'u3', fromUserId: 'u2' },
    ],
  });

  assert.equal(owned.stories?.length, 1);
  assert.equal(owned.shelves?.length, 1);
  assert.equal(owned.buddyReads?.length, 1);
  assert.equal(owned.buddyMessages?.length, 1);
  assert.equal(owned.notifications?.length, 2);

  const headerSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/Header.tsx'), 'utf8');
  assert.match(headerSrc, /markNotificationRead/);
  assert.match(headerSrc, /viewBookDetails/);
});
