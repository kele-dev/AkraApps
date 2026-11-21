import { fetchWithTimeout } from './http';

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

interface GoogleBookItem {
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

interface OpenLibraryDoc {
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

export interface SearchBooksOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export const searchBooksHybrid = async (
  queryText: string,
  limit: number = 10,
  filter: 'all' | 'title' | 'author' = 'all',
  options: SearchBooksOptions = {}
): Promise<SearchBookResult[]> => {
  const cleanQuery = queryText.trim();
  if (!cleanQuery) return [];
  const { signal, timeoutMs = 7000 } = options;

  // 1. Google Books API Query
  const googlePromise = (async () => {
    try {
      let googleFilter = cleanQuery;
      if (filter === 'title') googleFilter = `intitle:${cleanQuery}`;
      else if (filter === 'author') googleFilter = `inauthor:${cleanQuery}`;

      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(googleFilter)}&maxResults=${limit}`;
      const response = await fetchWithTimeout(url, { signal, timeoutMs });
      if (response.ok) {
        const data = (await response.json()) as { items?: GoogleBookItem[] };
        if (data.items) {
          return data.items.map((item) => {
            const info = item.volumeInfo ?? {};
            const cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80";
            const parsedYear = info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : undefined;
            return {
              id: item.id || `gb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: info.title || "Judul Tidak Diketahui",
              author: info.authors ? info.authors.join(", ") : "Penulis Tidak Diketahui",
              coverImage: cover,
              totalPages: info.pageCount || 200,
              category: info.categories ? info.categories[0] : "Umum",
              rating: typeof info.averageRating === 'number' ? info.averageRating : undefined,
              ratingsCount: typeof info.ratingsCount === 'number' ? info.ratingsCount : undefined,
              firstPublishYear: Number.isFinite(parsedYear) ? parsedYear : undefined,
            };
          });
        }
      }
    } catch (e) {
      if ((e as { name?: string })?.name !== 'AbortError') {
        console.warn("Google Books API query failed:", e);
      }
    }
    return [];
  })();

  // 2. Open Library API Query
  const openLibraryPromise = (async () => {
    try {
      let apiFilterParam = 'q';
      if (filter === 'title') apiFilterParam = 'title';
      else if (filter === 'author') apiFilterParam = 'author';

      const url = `https://openlibrary.org/search.json?${apiFilterParam}=${encodeURIComponent(cleanQuery)}&limit=${limit}`;
      const response = await fetchWithTimeout(url, { signal, timeoutMs });
      if (response.ok) {
        const data = (await response.json()) as { docs?: OpenLibraryDoc[] };
        if (data.docs) {
          return data.docs.map((doc) => {
            const cover = doc.cover_i 
              ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
              : "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80";
            return {
              id: doc.key || `ol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: doc.title || "Judul Tidak Diketahui",
              author: doc.author_name ? doc.author_name.join(", ") : "Penulis Tidak Diketahui",
              coverImage: cover,
              totalPages: doc.number_of_pages_median || 200,
              category: doc.subject ? doc.subject[0] : "Umum",
              rating: typeof doc.ratings_average === 'number' ? doc.ratings_average : undefined,
              ratingsCount: typeof doc.ratings_count === 'number' ? doc.ratings_count : undefined,
              firstPublishYear: typeof doc.first_publish_year === 'number' ? doc.first_publish_year : undefined,
            };
          });
        }
      }
    } catch (e) {
      if ((e as { name?: string })?.name !== 'AbortError') {
        console.warn("Open Library API query failed:", e);
      }
    }
    return [];
  })();

  // Run in parallel
  const [googleResults, olResults] = await Promise.all([googlePromise, openLibraryPromise]);

  // Combine and deduplicate by title + author case-insensitively
  const combined = [...googleResults, ...olResults];
  const seen = new Set<string>();
  const uniqueResults: SearchBookResult[] = [];

  for (const book of combined) {
    const key = `${book.title.toLowerCase().trim()}_${book.author.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueResults.push(book);
    }
  }

  return uniqueResults.slice(0, limit);
};
