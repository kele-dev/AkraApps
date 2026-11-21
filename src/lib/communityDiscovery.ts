import type { Book, BuddyRead, ReadingProgress, User } from '../types';

export interface ListopiaEntry {
  book: Book;
  averageRating: number;
  ratingsCount: number;
  readerCount: number;
}

export interface ReadingClubEntry {
  buddyReadId: string;
  book: Book;
  members: User[];
  createdAt: string;
}

/** Rank catalog books by average community rating and reader count, optionally filtered by query. */
export const buildListopiaRankings = (
  books: Book[],
  readingProgress: ReadingProgress[],
  query: string = ''
): ListopiaEntry[] => {
  const q = query.trim().toLowerCase();

  return books
    .filter(
      (b) =>
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.category?.toLowerCase().includes(q) ?? false)
    )
    .map((book) => {
      const entries = readingProgress.filter((p) => p.bookId === book.id);
      const rated = entries.filter((p) => typeof p.rating === 'number' && p.rating > 0);
      const totalRating = rated.reduce((sum, p) => sum + (p.rating || 0), 0);
      return {
        book,
        averageRating: rated.length > 0 ? parseFloat((totalRating / rated.length).toFixed(2)) : 0,
        ratingsCount: rated.length,
        readerCount: entries.length,
      };
    })
    .sort((a, b) => {
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
      if (b.readerCount !== a.readerCount) return b.readerCount - a.readerCount;
      return a.book.title.localeCompare(b.book.title);
    });
};

/** Aggregate active Buddy Reads into book reading clubs with resolved book & member info. */
export const buildReadingClubs = (
  buddyReads: BuddyRead[],
  books: Book[],
  users: User[],
  query: string = ''
): ReadingClubEntry[] => {
  const q = query.trim().toLowerCase();
  const clubs: ReadingClubEntry[] = [];

  for (const br of buddyReads) {
    const book = books.find((b) => b.id === br.bookId);
    if (!book) continue;
    if (
      q &&
      !book.title.toLowerCase().includes(q) &&
      !book.author.toLowerCase().includes(q)
    ) {
      continue;
    }

    const members = br.userIds
      .map((id) => users.find((u) => u.id === id))
      .filter((u): u is User => Boolean(u));

    clubs.push({
      buddyReadId: br.id,
      book,
      members,
      createdAt: br.createdAt,
    });
  }

  return clubs;
};
