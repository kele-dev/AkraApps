import type { Post, ReadingGoal, ReadingProgress } from '../types';

export const FIRESTORE_QUERY_LIMITS = {
  books: 200,
  users: 200,
  progress: 200,
  goals: 50,
  posts: 100,
  stories: 100,
  shelves: 100,
  buddyReads: 100,
  buddyMessages: 200,
  notifications: 100,
} as const;

export function canDeletePost(
  post: Pick<Post, 'userId'> | undefined | null,
  currentUserId: string
): boolean {
  if (!post || !currentUserId || currentUserId === 'guest') {
    return false;
  }
  return post.userId === currentUserId;
}

export function filterOwnedRecordsForSync<
  TProgress extends Pick<ReadingProgress, 'userId'>,
  TGoal extends Pick<ReadingGoal, 'userId'>,
  TPost extends Pick<Post, 'userId'>,
  TStory extends { userId: string } = { userId: string },
  TShelf extends { userId: string } = { userId: string },
  TBuddyRead extends { userIds: string[] } = { userIds: string[] },
  TBuddyMsg extends { userId: string } = { userId: string },
  TNotif extends { userId: string; fromUserId: string } = { userId: string; fromUserId: string }
>(
  currentUserId: string,
  records: {
    readingProgress: TProgress[];
    goals: TGoal[];
    posts: TPost[];
    stories?: TStory[];
    shelves?: TShelf[];
    buddyReads?: TBuddyRead[];
    buddyMessages?: TBuddyMsg[];
    notifications?: TNotif[];
  }
): {
  readingProgress: TProgress[];
  goals: TGoal[];
  posts: TPost[];
  stories: TStory[];
  shelves: TShelf[];
  buddyReads: TBuddyRead[];
  buddyMessages: TBuddyMsg[];
  notifications: TNotif[];
} {
  if (!currentUserId || currentUserId === 'guest') {
    return {
      readingProgress: [],
      goals: [],
      posts: [],
      stories: [],
      shelves: [],
      buddyReads: [],
      buddyMessages: [],
      notifications: [],
    };
  }
  return {
    readingProgress: records.readingProgress.filter((p) => p.userId === currentUserId),
    goals: records.goals.filter((g) => g.userId === currentUserId),
    posts: records.posts.filter((p) => p.userId === currentUserId),
    stories: (records.stories ?? []).filter((s) => s.userId === currentUserId),
    shelves: (records.shelves ?? []).filter((sh) => sh.userId === currentUserId),
    buddyReads: (records.buddyReads ?? []).filter((br) => br.userIds.includes(currentUserId)),
    buddyMessages: (records.buddyMessages ?? []).filter((bm) => bm.userId === currentUserId),
    notifications: (records.notifications ?? []).filter(
      (n) => n.userId === currentUserId || n.fromUserId === currentUserId
    ),
  };
}
