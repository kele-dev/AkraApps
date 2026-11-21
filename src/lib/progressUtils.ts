import type { Book, ReadingProgress } from '../types';

export interface ProgressTransitionInput {
  prevProgress: ReadingProgress[];
  books: Book[];
  userId: string;
  bookId: string;
  page: number;
  status: ReadingProgress['status'];
  rating?: number;
  idFactory?: () => string;
  nowIso?: () => string;
}

export interface ProgressTransitionResult {
  nextProgressList: ReadingProgress[];
  finalPage: number;
  finalStatus: ReadingProgress['status'];
  didNewlyComplete: boolean;
}

export function computeProgressTransition({
  prevProgress,
  books,
  userId,
  bookId,
  page,
  status,
  rating,
  idFactory = () =>
    typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function'
      ? `p_${globalThis.crypto.randomUUID()}`
      : `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  nowIso = () => new Date().toISOString(),
}: ProgressTransitionInput): ProgressTransitionResult {
  const existingIdx = prevProgress.findIndex(
    (p) => p.userId === userId && p.bookId === bookId
  );
  const book = books.find((b) => b.id === bookId);
  const limitPage = book ? book.totalPages : page;

  const finalStatus: ReadingProgress['status'] =
    status === 'COMPLETED' || page >= limitPage ? 'COMPLETED' : status;
  const finalPage =
    finalStatus === 'COMPLETED' ? limitPage : Math.max(0, Math.min(page, limitPage));

  const nextProgressList = [...prevProgress];
  if (existingIdx > -1) {
    nextProgressList[existingIdx] = {
      ...nextProgressList[existingIdx],
      currentPage: finalPage,
      status: finalStatus,
      rating: rating !== undefined ? rating : nextProgressList[existingIdx].rating,
      updatedAt: nowIso(),
    };
  } else {
    nextProgressList.push({
      id: idFactory(),
      userId,
      bookId,
      currentPage: finalPage,
      status: finalStatus,
      rating,
      updatedAt: nowIso(),
    });
  }

  const didNewlyComplete =
    finalStatus === 'COMPLETED' &&
    (existingIdx === -1 || prevProgress[existingIdx].status !== 'COMPLETED');

  return {
    nextProgressList,
    finalPage,
    finalStatus,
    didNewlyComplete,
  };
}
