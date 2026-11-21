import { fetchWithTimeout } from './http';
import {
  deduplicateBookResults,
  normalizeGoogleBooksItems,
  normalizeOpenLibraryDocs,
  type GoogleBookItem,
  type OpenLibraryDoc,
  type SearchBookResult,
} from './bookSearchUtils';

export type { SearchBookResult };

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

  const googlePromise = (async () => {
    try {
      let googleFilter = cleanQuery;
      if (filter === 'title') googleFilter = `intitle:${cleanQuery}`;
      else if (filter === 'author') googleFilter = `inauthor:${cleanQuery}`;

      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(googleFilter)}&maxResults=${limit}`;
      const response = await fetchWithTimeout(url, { signal, timeoutMs });
      if (response.ok) {
        const data = (await response.json()) as { items?: GoogleBookItem[] };
        if (data.items) return normalizeGoogleBooksItems(data.items);
      }
    } catch (e) {
      if ((e as { name?: string })?.name !== 'AbortError') {
        console.warn('Google Books API query failed:', e);
      }
    }
    return [];
  })();

  const openLibraryPromise = (async () => {
    try {
      let apiFilterParam = 'q';
      if (filter === 'title') apiFilterParam = 'title';
      else if (filter === 'author') apiFilterParam = 'author';

      const url = `https://openlibrary.org/search.json?${apiFilterParam}=${encodeURIComponent(cleanQuery)}&limit=${limit}`;
      const response = await fetchWithTimeout(url, { signal, timeoutMs });
      if (response.ok) {
        const data = (await response.json()) as { docs?: OpenLibraryDoc[] };
        if (data.docs) return normalizeOpenLibraryDocs(data.docs);
      }
    } catch (e) {
      if ((e as { name?: string })?.name !== 'AbortError') {
        console.warn('Open Library API query failed:', e);
      }
    }
    return [];
  })();

  const [googleResults, olResults] = await Promise.all([googlePromise, openLibraryPromise]);
  return deduplicateBookResults([...googleResults, ...olResults], limit);
};
