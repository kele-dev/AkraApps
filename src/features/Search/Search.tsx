"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useApp, translations } from '../../context/AppContext';
import { Search, Star, ChevronDown, Check, Users, BookOpen, Quote, HelpCircle } from 'lucide-react';
import { LOCAL_BOOK_DATABASE } from '../Books/Books';
import { Book } from '../../types';
import { searchBooksHybrid, type SearchBookResult } from '../../lib/bookApi';
import { filterLocalBooks } from '../../lib/bookSearchUtils';
import { BookCover, UserAvatar } from '../../components/Media';

export const SearchPage: React.FC = () => {
  const { 
    books, 
    readingProgress, 
    updateProgress, 
    addBook, 
    users, 
    posts, 
    globalSearchQuery, 
    setGlobalSearchQuery,
    currentUser,
    viewBookDetails,
    language
  } = useApp();

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'title' | 'author'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'books' | 'groups' | 'quotes' | 'people' | 'listopia'>('books');

  // Search execution states
  const [searchResults, setSearchResults] = useState<SearchBookResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [searchWarning, setSearchWarning] = useState('');

  // Dropdown states for each book item
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Local state for user ratings (to light up stars in the list)
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  // Ref for closing dropdowns on click outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Listen to global searches from Header
  useEffect(() => {
    if (globalSearchQuery.trim()) {
      setSearchQuery(globalSearchQuery);
      handleSearch(globalSearchQuery);
      setGlobalSearchQuery('');
    }
  }, [globalSearchQuery]);

  // Execute Search
  const handleSearch = async (overrideQuery?: string) => {
    const queryToUse = (typeof overrideQuery === 'string' ? overrideQuery : searchQuery).trim();
    if (!queryToUse) return;

    setIsSearching(true);
    setSearchWarning('');
    const startTime = performance.now();

    try {
      const results = await searchBooksHybrid(queryToUse, 10, searchFilter);
      const endTime = performance.now();
      setSearchTime(parseFloat(((endTime - startTime) / 1000).toFixed(2)));

      if (results.length > 0) {
        setSearchResults(results);
        setTotalResults(results.length);
      } else {
        triggerLocalFallback(queryToUse, startTime);
      }
    } catch (e) {
      console.warn("Pencarian API gagal di Halaman Search, beralih ke lokal:", e);
      triggerLocalFallback(queryToUse, startTime, "Pencarian API gagal (offline). Menampilkan hasil database lokal.");
    } finally {
      setIsSearching(false);
    }
  };

  const triggerLocalFallback = (queryText: string, startTime: number, warningMsg = '') => {
    setSearchWarning(warningMsg || "Buku tidak ditemukan. Menampilkan hasil database lokal.");
    const filtered = filterLocalBooks(LOCAL_BOOK_DATABASE, queryText);
    setSearchResults(filtered);
    setTotalResults(filtered.length);
    const endTime = performance.now();
    setSearchTime(parseFloat(((endTime - startTime) / 1000).toFixed(2)));
  };

  // Find if a book is in user's library and return status
  const getLibraryStatus = (bookTitle: string, bookAuthor: string) => {
    const existing = books.find(
      (b) => b.title.toLowerCase() === bookTitle.toLowerCase() && b.author.toLowerCase() === bookAuthor.toLowerCase()
    );
    if (!existing) return null;

    const progress = readingProgress.find((p) => p.userId === currentUser.id && p.bookId === existing.id);
    return {
      bookId: existing.id,
      status: progress ? progress.status : 'WANT_TO_READ',
      currentPage: progress ? progress.currentPage : 0,
      totalPages: existing.totalPages
    };
  };

  // Add book to library and set shelf
  const handleAddToShelf = (bookData: Book | SearchBookResult, status: 'WANT_TO_READ' | 'READING' | 'COMPLETED') => {
    // 1. Check if already in library
    let existing = books.find(
      (b) => b.title.toLowerCase() === bookData.title.toLowerCase() && b.author.toLowerCase() === bookData.author.toLowerCase()
    );

    let bookId = existing?.id;

    if (!existing) {
      // Add to books
      const newBook = addBook(
        bookData.title, 
        bookData.author, 
        bookData.totalPages || 200, 
        bookData.category || 'Umum', 
        bookData.coverImage
      );
      bookId = newBook?.id;
    }

    if (bookId) {
      // 2. Set reading progress / status
      const totalPages = existing ? existing.totalPages : (bookData.totalPages || 200);
      const targetPage = status === 'COMPLETED' ? totalPages : 0;
      updateProgress(bookId, targetPage, status);
    }

    setActiveDropdownId(null);
  };

  // Rate book directly
  const handleRateBook = (bookData: Book | SearchBookResult, rating: number) => {
    setUserRatings(prev => ({ ...prev, [bookData.title + bookData.author]: rating }));
    // Automatically add to library as completed/read
    handleAddToShelf(bookData, 'COMPLETED');
  };

  // Filter local users for People tab
  const getFilteredPeople = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return users.filter(
      (u) => u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
  };

  // Filter local quotes for Quotes tab
  const getFilteredQuotes = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return posts.filter(
      (p) => p.type === 'QUOTE' && (p.content.toLowerCase().includes(q) || (p.bookTitle && p.bookTitle.toLowerCase().includes(q)))
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-[800px] mx-auto animate-fade-in text-text-slate-dark bg-white p-6 rounded-lg border border-border-light-gray shadow-xs">
      {/* Title */}
      <h2 className="text-2xl font-serif text-brand-espresso font-extrabold leading-none pb-2 border-b border-border-light-gray">
        {language === 'id' ? 'Pencarian' : 'Search'}
      </h2>

      {/* Goodreads Search Container box */}
      <div className="bg-surface-parchment border border-border-parchment rounded p-4 flex flex-col gap-3">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }} 
          className="flex gap-2"
        >
          <input
            type="text"
            aria-label={language === 'id' ? 'Cari berdasarkan judul, penulis, atau kata kunci' : 'Search by title, author, or keyword'}
            className="input-field flex-1 px-3 py-2 rounded border border-[#d6d0c0] bg-white text-sm text-text-slate-dark focus:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange/40"
            placeholder={language === 'id' ? 'Cari berdasarkan judul, penulis, atau kata kunci...' : 'Search by title, author, or keyword...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#f4f1ea] hover:bg-[#e8e3d6] text-text-slate-dark font-semibold border border-[#d6d0c0] rounded text-sm shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            disabled={isSearching}
          >
            <Search size={14} />
            {isSearching ? (language === 'id' ? 'Mencari...' : 'Searching...') : (language === 'id' ? 'Cari' : 'Search')}
          </button>
        </form>

        {/* Radio Filter Options */}
        <div className="flex gap-4 items-center text-xs text-text-slate-medium pl-1 select-none">
          {([
            { id: 'all', label: language === 'id' ? 'semua' : 'all' },
            { id: 'title', label: language === 'id' ? 'judul' : 'title' },
            { id: 'author', label: language === 'id' ? 'penulis' : 'author' }
          ] as const).map((item) => (
            <label key={item.id} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="searchFilter"
                checked={searchFilter === item.id}
                onChange={() => setSearchFilter(item.id)}
                className="accent-brand-orange text-brand-orange"
              />
              <span className={searchFilter === item.id ? "text-text-slate-dark font-semibold" : ""}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex border-b border-border-light-gray overflow-x-auto">
        {([
          { id: 'books', label: language === 'id' ? 'Buku' : 'Books' },
          { id: 'groups', label: language === 'id' ? 'Grup' : 'Groups' },
          { id: 'quotes', label: language === 'id' ? 'Kutipan' : 'Quotes' },
          { id: 'people', label: language === 'id' ? 'Teman' : 'People' },
          { id: 'listopia', label: 'Listopia' }
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 border-none font-bold text-xs whitespace-nowrap cursor-pointer transition-all border-b-2 ${
              activeSubTab === tab.id
                ? 'border-[#382110] text-[#382110] font-extrabold'
                : 'border-transparent text-text-slate-medium hover:text-text-slate-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Warnings & Stats */}
      {searchWarning && (
        <div className="text-[11px] text-brand-orange bg-brand-orange-glow px-3 py-2 rounded border border-brand-orange/20 font-semibold animate-fade-in">
          ⚠️ {searchWarning}
        </div>
      )}

      {/* Main Results Switching */}
      <div className="flex flex-col gap-4">
        {activeSubTab === 'books' && (
          <>
            {/* Search Statistics */}
            {searchResults.length > 0 && (
              <div className="text-xs text-text-slate-medium italic">
                {language === 'id' 
                  ? `Halaman 1 dari sekitar ${totalResults} hasil (${searchTime} detik)` 
                  : `Page 1 of about ${totalResults} results (${searchTime} seconds)`}
              </div>
            )}

            {/* Books Results list */}
            {isSearching ? (
              <div className="flex flex-col gap-4 divide-y divide-border-light-gray">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="py-4 flex gap-4 items-start first:pt-0 animate-pulse">
                    {/* Left: Book Cover Skeleton */}
                    <div className="skeleton w-16 h-22 shrink-0 bg-gray-200" />
                    
                    {/* Right: Details Skeleton */}
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="skeleton w-1/2 h-5 bg-gray-200" />
                      <div className="skeleton w-1/4 h-3.5 bg-gray-200" />
                      <div className="skeleton w-1/3 h-3 bg-gray-200" />
                      <div className="flex gap-2.5 items-center mt-2">
                        <div className="skeleton w-24 h-7 bg-gray-200" />
                        <div className="skeleton w-20 h-7 bg-gray-200" />
                        <div className="skeleton w-32 h-4 bg-gray-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-border-light-gray flex flex-col" ref={dropdownRef}>
                {searchResults.map((book) => {
                  const libStatus = getLibraryStatus(book.title, book.author);
                  const userRating = userRatings[book.title + book.author] || 0;

                  return (
                    <div key={book.id} className="py-4 flex gap-4 items-start first:pt-0">
                      {/* Left: Book Cover */}
                      <button
                        type="button"
                        onClick={() => viewBookDetails(book)}
                        aria-label={book.title}
                        className="p-0 border-none bg-transparent cursor-pointer shrink-0 rounded"
                      >
                        <BookCover
                          src={book.coverImage}
                          alt={book.title}
                          width={64}
                          height={88}
                          className="w-16 h-22 object-cover rounded shadow-xs border border-border-light-gray bg-gray-50 hover:opacity-85 transition-opacity"
                        />
                      </button>

                      {/* Right: Book Details */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        {/* Title */}
                        <h4 className="text-sm font-bold text-text-slate-dark font-serif leading-snug">
                          <button
                            type="button"
                            onClick={() => viewBookDetails(book)}
                            className="text-left bg-transparent border-none p-0 font-bold text-text-slate-dark hover:underline cursor-pointer font-serif"
                          >
                            {book.title}
                          </button>
                        </h4>

                        {/* Author */}
                        <p className="text-[11px] text-text-slate-medium">
                          by <span className="text-text-slate-dark font-medium">{book.author}</span>
                          <span className="text-text-slate-light text-[9px] ml-1">(Goodreads Author)</span>
                        </p>

                        {/* Ratings statistics */}
                        <div className="flex items-center gap-1 text-[10px] text-text-slate-medium">
                          {(book.ratingsCount ?? 0) > 0 ? (
                            <>
                              <div className="flex text-yellow-500 shrink-0">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    size={10}
                                    fill={s <= Math.round(book.rating ?? 0) ? "currentColor" : "none"}
                                    className="stroke-1"
                                  />
                                ))}
                              </div>
                              <span>
                                {(book.rating ?? 0).toFixed(2)} rating rata-rata — {(book.ratingsCount ?? 0).toLocaleString('id-ID')} penilaian — terbit {book.firstPublishYear ?? '-'}
                              </span>
                            </>
                          ) : (
                            <span>
                              Belum ada penilaian — terbit {book.firstPublishYear ?? '-'}
                            </span>
                          )}
                        </div>

                        {/* Shelf Button & Star Rating Row */}
                        <div className="flex flex-wrap gap-4 items-center mt-2.5">
                          {/* Goodreads Shelf Split Button */}
                          <div className="relative inline-flex items-stretch rounded h-7 text-[11px] font-bold">
                            {libStatus ? (
                              /* Case: Book already in library */
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 border border-border-light-gray rounded text-text-slate-dark select-none shadow-2xs">
                                <Check size={12} className="text-brand-green" />
                                <span>
                                  {libStatus.status === 'WANT_TO_READ' && 'Ingin Baca'}
                                  {libStatus.status === 'READING' && 'Sedang Dibaca'}
                                  {libStatus.status === 'COMPLETED' && 'Selesai Dibaca'}
                                </span>
                              </div>
                            ) : (
                              /* Case: Book NOT in library */
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAddToShelf(book, 'WANT_TO_READ')}
                                  className="px-3 bg-brand-forest hover:bg-brand-forest-hover text-white border-none rounded-l cursor-pointer transition-colors shadow-2xs flex items-center justify-center font-bold"
                                >
                                  {translations[language].wantToRead}
                                </button>
                                <button
                                  type="button"
                                  aria-label={language === 'id' ? `Pilih rak untuk ${book.title}` : `Select shelf for ${book.title}`}
                                  onClick={() => setActiveDropdownId(activeDropdownId === book.id ? null : book.id)}
                                  className="px-1.5 bg-brand-forest hover:bg-brand-forest-hover text-white border-l border-white/20 rounded-r cursor-pointer transition-colors flex items-center justify-center"
                                >
                                  <ChevronDown size={12} />
                                </button>
                              </>
                            )}

                            {/* Dropdown Options overlay */}
                            {activeDropdownId === book.id && (
                              <div className="absolute left-0 mt-8 w-40 bg-white border border-border-light-gray rounded shadow-md flex flex-col p-1 z-50 animate-fade-in divide-y divide-border-light-gray/50">
                                {([
                                  { id: 'WANT_TO_READ', label: translations[language].wantToRead },
                                  { id: 'READING', label: translations[language].currentlyReading },
                                  { id: 'COMPLETED', label: translations[language].read }
                                ] as const).map((option) => (
                                  <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleAddToShelf(book, option.id)}
                                    className="w-full text-left px-2 py-1.5 text-[10px] font-semibold text-text-slate-medium hover:bg-gray-100 hover:text-text-slate-dark transition-all border-none bg-transparent cursor-pointer"
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Rate this book stars */}
                          <div className="flex items-center gap-1 text-[10px] text-text-slate-medium select-none ml-1">
                            <span className="shrink-0">{translations[language].rateThisBook}:</span>
                            <div className="flex text-yellow-500" role="radiogroup" aria-label={translations[language].rateThisBook}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => handleRateBook(book, star)}
                                  aria-label={`${star} ${language === 'id' ? 'bintang' : 'stars'}`}
                                  className="bg-transparent border-none p-0.5 cursor-pointer text-gray-300"
                                >
                                  <Star
                                    size={12}
                                    className={`transition-colors ${
                                      star <= userRating 
                                        ? "text-yellow-500 fill-current" 
                                        : "hover:text-yellow-400"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : searchQuery.trim() ? (
              <div className="flex flex-col items-center py-16 gap-2 text-text-slate-light">
                <HelpCircle size={28} />
                <span className="text-xs font-semibold">Tidak ditemukan hasil pencarian. Coba kata kunci lain.</span>
              </div>
            ) : (
              <div className="flex flex-col items-center py-16 gap-2 text-text-slate-light border-2 border-dashed border-border-light-gray rounded-lg">
                <BookOpen size={28} className="text-text-slate-light/60" />
                <span className="text-xs font-semibold text-text-slate-medium">Ketikkan sesuatu di atas untuk mulai mencari buku</span>
              </div>
            )}
          </>
        )}

        {activeSubTab === 'people' && (
          <div className="flex flex-col gap-3">
            <div className="text-xs text-text-slate-medium italic">
              Hasil pencarian teman ({getFilteredPeople().length} hasil)
            </div>
            {getFilteredPeople().length > 0 ? (
              <div className="divide-y divide-border-light-gray flex flex-col">
                {getFilteredPeople().map((user) => (
                  <div key={user.id} className="py-3 flex gap-3 items-center first:pt-0">
                    <UserAvatar src={user.avatar} alt={user.displayName} width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-border-light-gray" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-text-slate-dark">{user.displayName}</h4>
                      <p className="text-[10px] text-text-slate-light">@{user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-text-slate-light text-xs font-semibold">
                Tidak ada pengguna yang cocok dengan pencarian Anda.
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'quotes' && (
          <div className="flex flex-col gap-3">
            <div className="text-xs text-text-slate-medium italic">
              Hasil pencarian kutipan ({getFilteredQuotes().length} hasil)
            </div>
            {getFilteredQuotes().length > 0 ? (
              <div className="divide-y divide-border-light-gray flex flex-col">
                {getFilteredQuotes().map((post) => (
                  <div key={post.id} className="py-3 flex flex-col gap-1 first:pt-0">
                    <p className="text-xs italic text-text-slate-dark font-medium">"{post.content}"</p>
                    <p className="text-[10px] text-text-slate-medium">
                      Oleh: <span className="font-bold">{post.userDisplayName}</span>
                      {post.bookTitle && <span> • Buku: <span className="italic">{post.bookTitle}</span></span>}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-text-slate-light text-xs font-semibold">
                Tidak ada kutipan yang cocok dengan pencarian Anda.
              </div>
            )}
          </div>
        )}

        {(activeSubTab === 'groups' || activeSubTab === 'listopia') && (
          <div className="py-16 flex flex-col items-center gap-2 text-text-slate-light border border-border-light-gray bg-bg-light-gray/40 rounded-lg">
            <Users size={28} className="text-text-slate-light/60" />
            <span className="text-xs font-semibold text-text-slate-medium">Fitur {activeSubTab === 'groups' ? 'Grup' : 'Listopia'} sedang dikembangkan.</span>
          </div>
        )}
      </div>

    </div>
  );
};
