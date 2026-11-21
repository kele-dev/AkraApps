export interface OpenLibraryEditionEntry {
  number_of_pages?: number;
  physical_format?: string;
  isbn_13?: string[];
  isbn_10?: string[];
  publishers?: string[];
  languages?: Array<{ key?: string }>;
}

export interface EditionMetadata {
  isbn13?: string;
  isbn10?: string;
  publisher?: string;
  languageLabel?: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  eng: 'English',
  ind: 'Indonesian',
  msa: 'Malay',
  jpn: 'Japanese',
  fra: 'French',
  deu: 'German',
  ger: 'German',
  spa: 'Spanish',
  ara: 'Arabic',
  zho: 'Chinese',
  chi: 'Chinese',
};

/** Extract real ISBN, publisher, and language metadata from Open Library editions. */
export const extractEditionMetadata = (
  entries: OpenLibraryEditionEntry[] = []
): EditionMetadata => {
  const isbn13 = entries.find((e) => e.isbn_13 && e.isbn_13.length > 0)?.isbn_13?.[0];
  const isbn10 = entries.find((e) => e.isbn_10 && e.isbn_10.length > 0)?.isbn_10?.[0];
  const publisher = entries.find((e) => e.publishers && e.publishers.length > 0)?.publishers?.[0];
  const rawLangKey = entries.find((e) => e.languages && e.languages.length > 0)?.languages?.[0]?.key;

  let languageLabel: string | undefined;
  if (rawLangKey) {
    const code = rawLangKey.split('/').pop()?.toLowerCase() ?? '';
    if (code) {
      languageLabel = LANGUAGE_LABELS[code] || code.toUpperCase();
    }
  }

  return { isbn13, isbn10, publisher, languageLabel };
};
