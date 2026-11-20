import type { ReadingProgress } from '../types';

export function resolveUserBookRating(
  progress?: Pick<ReadingProgress, 'status' | 'rating'> | null
): number {
  if (!progress || typeof progress.rating !== 'number') return 0;
  return progress.rating;
}
