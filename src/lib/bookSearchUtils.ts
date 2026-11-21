export interface SearchBookResult {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  totalPages: number;
  category?: string;
  rating?: number;
  ratingsCount?: number;
  firstPublishYear?: number;
}

export interface GoogleBookItem {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    publishedDate?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
}

export interface OpenLibraryDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  subject?: string[];
  ratings_average?: number;
  ratings_count?: number;
  first_publish_year?: number;
}

const DEFAULT_BOOK_COVER =
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80';

/** Normalize raw Google Books volume items into uniform SearchBookResult entries. */
export const normalizeGoogleBooksItems = (items: GoogleBookItem[]): SearchBookResult[] =>
  items.map((item, idx) => {
    const info = item.volumeInfo ?? {};
    const cover =
      info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || DEFAULT_BOOK_COVER;
    const parsedYear = info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : undefined;
    return {
      id: item.id || `gb_${Date.now()}_${idx}`,
      title: info.title || 'Judul Tidak Diketahui',
      author: info.authors ? info.authors.join(', ') : 'Penulis Tidak Diketahui',
      coverImage: cover,
      totalPages: info.pageCount || 200,
      category: info.categories ? info.categories[0] : 'Umum',
      rating: typeof info.averageRating === 'number' ? info.averageRating : undefined,
      ratingsCount: typeof info.ratingsCount === 'number' ? info.ratingsCount : undefined,
      firstPublishYear: Number.isFinite(parsedYear) ? parsedYear : undefined,
    };
  });

/** Normalize raw Open Library search docs into uniform SearchBookResult entries. */
export const normalizeOpenLibraryDocs = (docs: OpenLibraryDoc[]): SearchBookResult[] =>
  docs.map((doc, idx) => {
    const cover = doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : DEFAULT_BOOK_COVER;
    return {
      id: doc.key || `ol_${Date.now()}_${idx}`,
      title: doc.title || 'Judul Tidak Diketahui',
      author: doc.author_name ? doc.author_name.join(', ') : 'Penulis Tidak Diketahui',
      coverImage: cover,
      totalPages: doc.number_of_pages_median || 200,
      category: doc.subject ? doc.subject[0] : 'Umum',
      rating: typeof doc.ratings_average === 'number' ? doc.ratings_average : undefined,
      ratingsCount: typeof doc.ratings_count === 'number' ? doc.ratings_count : undefined,
      firstPublishYear: typeof doc.first_publish_year === 'number' ? doc.first_publish_year : undefined,
    };
  });

/** Deduplicate SearchBookResult items by case-insensitive title+author up to limit. */
export const deduplicateBookResults = (
  items: SearchBookResult[],
  limit: number
): SearchBookResult[] => {
  const seen = new Set<string>();
  const uniqueResults: SearchBookResult[] = [];

  for (const book of items) {
    const key = `${book.title.toLowerCase().trim()}_${book.author.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueResults.push(book);
      if (uniqueResults.length >= limit) break;
    }
  }

  return uniqueResults;
};

/** Filter local catalog entries by case-insensitive title or author match. */
export const filterLocalBooks = <T extends { title: string; author: string }>(
  books: T[],
  query: string
): T[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return books.filter(
    (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
  );
};
