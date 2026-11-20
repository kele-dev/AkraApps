import type { Post, ReadingGoal, ReadingProgress } from '../types';

export const FIRESTORE_QUERY_LIMITS = {
  books: 200,
  users: 200,
  progress: 200,
  goals: 50,
  posts: 100,
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
  TPost extends Pick<Post, 'userId'>
>(
  currentUserId: string,
  records: {
    readingProgress: TProgress[];
    goals: TGoal[];
    posts: TPost[];
  }
): {
  readingProgress: TProgress[];
  goals: TGoal[];
  posts: TPost[];
} {
  if (!currentUserId || currentUserId === 'guest') {
    return { readingProgress: [], goals: [], posts: [] };
  }
  return {
    readingProgress: records.readingProgress.filter((p) => p.userId === currentUserId),
    goals: records.goals.filter((g) => g.userId === currentUserId),
    posts: records.posts.filter((p) => p.userId === currentUserId),
  };
}
