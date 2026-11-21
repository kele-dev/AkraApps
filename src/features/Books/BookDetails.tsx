"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useApp, translations } from '../../context/AppContext';
import { getRichBookDetail, RichBookDetail } from './bookDetailsData';
import { ArrowLeft, Star, Share2, ChevronDown, ChevronUp, Pen, Check } from 'lucide-react';
import { ProgressBar } from '../../components/ProgressBar';
import { BookCover, UserAvatar } from '../../components/Media';
import { BuddyReadSection } from './BuddyReadSection';
import { fetchWithTimeout } from '../../lib/http';
import { resolveUserBookRating } from '../../lib/bookRating';
import { logger } from '../../lib/logger';

export const BookDetails: React.FC = () => {
  const { 
    selectedBook, 
    setCurrentTab, 
    previousTab,
    books,
    readingProgress,
    updateProgress,
    addBook,
    currentUser,
    users,
    buddyReads,
    buddyMessages,
    startBuddyRead,
    addBuddyMessage,
    viewBookDetails,
    language,
    showToast
  } = useApp();

  const [richDetail, setRichDetail] = useState<RichBookDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isEditionsExpanded, setIsEditionsExpanded] = useState(false);
  const [showShelfDropdown, setShowShelfDropdown] = useState(false);
  const [inputPage, setInputPage] = useState<number | undefined>(undefined);
  
  // Local rating for interactive stars
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [animatingStar, setAnimatingStar] = useState<number | null>(null);
  
  const [followedAuthors, setFollowedAuthors] = useState<string[]>([]);

  const shelfDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shelfDropdownRef.current && !shelfDropdownRef.current.contains(event.target as Node)) {
        setShowShelfDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch or generate details when selected book changes
  useEffect(() => {
    if (!selectedBook) return;

    let active = true;
    const controller = new AbortController();

    const loadData = async () => {
      setIsLoading(true);
      setIsDescExpanded(false);
      setIsEditionsExpanded(false);
      setInputPage(undefined);
      setUserRating(0);

      try {
        let workId = selectedBook.id;

        // If local book, try to search for it on Open Library first
        if (!workId.startsWith('/')) {
          try {
            const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(selectedBook.title)}&author=${encodeURIComponent(selectedBook.author)}&limit=1`;
            const searchRes = await fetchWithTimeout(searchUrl, { signal: controller.signal });
            if (searchRes.ok) {
              const searchData = await searchRes.json();
              if (searchData.docs && searchData.docs.length > 0) {
                workId = searchData.docs[0].key;
              }
            }
          } catch (err) {
            if ((err as { name?: string })?.name !== 'AbortError') {
              logger.warn('openlibrary.search_lookup_failed', { error: err });
            }
          }
        }

        // If it starts with /works/ or /books/, fetch from Open Library
        if (workId.startsWith('/')) {
          const workUrl = `https://openlibrary.org${workId}.json`;
          const workRes = await fetchWithTimeout(workUrl, { signal: controller.signal });
          if (!workRes.ok) throw new Error("Gagal mengambil data buku dari Open Library");
          const workData = await workRes.json();

          // Handle description which can be string or object
          let descriptionText = "";
          if (workData.description) {
            if (typeof workData.description === 'string') {
              descriptionText = workData.description;
            } else if (workData.description.value) {
              descriptionText = workData.description.value;
            }
          }

          // Handle subjects/genres
          const genres = workData.subjects ? workData.subjects.slice(0, 5) : [selectedBook.category || "Fiksi"];

          // Stable rating stats based on seed (used as fallback or for reviews)
          const titleCharSum = selectedBook.title.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
          const seed = titleCharSum;
          let rating = parseFloat((3.8 + (seed % 11) * 0.1).toFixed(2));
          let ratingsCount = (seed * 17) % 45000 + 350;
          const publishedDate = workData.first_publish_date || "2015";
          let pages = selectedBook.totalPages || 200;
          let binding = "Paperback";
          let authorName = selectedBook.author;
          let authorAvatar = "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80";
          let authorBio = `${authorName} adalah penulis terkemuka yang berkontribusi banyak dalam dunia sastra.`;
          let authorStats = "12 books · 1.2k followers";

          const authorKey = workData.authors?.[0]?.author?.key as string | undefined;

          const [ratingsRes, editionsRes, authorRes] = await Promise.all([
            fetchWithTimeout(`https://openlibrary.org${workId}/ratings.json`, { signal: controller.signal }).catch((err) => {
              if ((err as { name?: string })?.name !== 'AbortError') {
                logger.warn('openlibrary.ratings_fetch_failed', { error: err });
              }
              return null;
            }),
            fetchWithTimeout(`https://openlibrary.org${workId}/editions.json?limit=10`, { signal: controller.signal }).catch((err) => {
              if ((err as { name?: string })?.name !== 'AbortError') {
                logger.warn('openlibrary.editions_fetch_failed', { error: err });
              }
              return null;
            }),
            authorKey
              ? fetchWithTimeout(`https://openlibrary.org${authorKey}.json`, { signal: controller.signal }).catch((err) => {
                  if ((err as { name?: string })?.name !== 'AbortError') {
                    logger.warn('openlibrary.author_fetch_failed', { error: err });
                  }
                  return null;
                })
              : Promise.resolve(null),
          ]);

          if (ratingsRes?.ok) {
            const ratingsData = await ratingsRes.json();
            if (ratingsData.summary) {
              if (ratingsData.summary.average && ratingsData.summary.average > 0) {
                rating = parseFloat(ratingsData.summary.average.toFixed(2));
              }
              if (ratingsData.summary.count && ratingsData.summary.count > 0) {
                ratingsCount = ratingsData.summary.count;
              }
            }
          }

          if (editionsRes?.ok) {
            const editionsData = (await editionsRes.json()) as {
              entries?: Array<{ number_of_pages?: number; physical_format?: string }>;
            };
            if (editionsData.entries && editionsData.entries.length > 0) {
              const withPages = editionsData.entries.find((e) => e.number_of_pages && e.number_of_pages > 5);
              if (withPages && withPages.number_of_pages) {
                pages = withPages.number_of_pages;
                if (withPages.physical_format) binding = withPages.physical_format;
              } else {
                const first = editionsData.entries[0];
                if (first.number_of_pages) pages = first.number_of_pages;
                if (first.physical_format) binding = first.physical_format;
              }
            }
          }

          if (authorRes?.ok) {
            const authorData = await authorRes.json();
            authorName = authorData.name || authorData.personal_name || authorName;
            if (authorData.bio) {
              if (typeof authorData.bio === 'string') {
                authorBio = authorData.bio;
              } else if (authorData.bio.value) {
                authorBio = authorData.bio.value;
              }
            }
            if (authorData.photos && authorData.photos.length > 0) {
              authorAvatar = `https://covers.openlibrary.org/a/id/${authorData.photos[0]}-M.jpg`;
            }
            authorStats = `${(seed % 15) + 3} books · ${((seed * 3) % 20) + 1}k followers`;
          }

          const reviewsCount = Math.max(1, Math.floor(ratingsCount * (0.04 + (seed % 3) * 0.01)));
          const currentlyReadingCount = (seed * 11) % 5000 + 150;
          const wantToReadCount = (seed * 47) % 50000 + 1200;

          if (active) {
            setRichDetail({
              id: selectedBook.id,
              title: selectedBook.title,
              author: authorName,
              coverImage: selectedBook.coverImage,
              totalPages: pages,
              category: selectedBook.category || "Fiksi",
              rating,
              ratingsCount,
              reviewsCount,
              description: descriptionText || `Buku "${selectedBook.title}" adalah karya luar biasa oleh ${authorName}.`,
              genres,
              publishedDate,
              binding,
              tagline: `Menjelajahi keindahan pemikiran dalam ${selectedBook.title}.`,
              authorAvatar,
              authorBio,
              authorStats,
              currentlyReadingCount,
              wantToReadCount
            });
            setIsLoading(false);
          }
          return;
        }

        // Default Fallback
        const fallbackDetails = getRichBookDetail(selectedBook);
        if (active) {
          setRichDetail(fallbackDetails);
          setIsLoading(false);
        }
      } catch (err) {
        if ((err as { name?: string })?.name !== 'AbortError') {
          logger.error('openlibrary.sync_failed', { error: err });
        }
        const fallbackDetails = getRichBookDetail(selectedBook);
        if (active) {
          setRichDetail(fallbackDetails);
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedBook]);

  // Get current book state from user's library
  const libraryBook = richDetail ? books.find(b => b.title.toLowerCase() === richDetail.title.toLowerCase() && b.author.toLowerCase() === richDetail.author.toLowerCase()) : null;
  const progress = libraryBook ? readingProgress.find(p => p.userId === currentUser.id && p.bookId === libraryBook.id) : null;
  const currentShelf = progress ? progress.status : null; // 'WANT_TO_READ' | 'READING' | 'COMPLETED' | null
  const displayedUserRating = userRating || resolveUserBookRating(progress);

  if (!selectedBook || !richDetail) {
    return (
      <div className="flex flex-col items-center py-20 gap-4 text-text-slate-medium">
        <p className="font-semibold text-sm">{language === 'id' ? 'Tidak ada buku yang dipilih.' : 'No book selected.'}</p>
        <button className="btn-primary active-pop" onClick={() => setCurrentTab('books')}>
          {language === 'id' ? 'Kembali ke Perpustakaan' : 'Back to Library'}
        </button>
      </div>
    );
  }

  // Find all books in the database matching this title and author
  const allMatchingBookIds = books
    .filter(b => b.title.toLowerCase() === richDetail.title.toLowerCase() && b.author.toLowerCase() === richDetail.author.toLowerCase())
    .map(b => b.id);
  const appProgressesForThisBook = readingProgress.filter(p => allMatchingBookIds.includes(p.bookId));

  const currentlyReadingCount = appProgressesForThisBook.filter(p => p.status === 'READING').length;
  const wantToReadCount = appProgressesForThisBook.filter(p => p.status === 'WANT_TO_READ').length;
  const completedCount = appProgressesForThisBook.filter(p => p.status === 'COMPLETED').length;

  const handleShelfChange = (status: 'WANT_TO_READ' | 'READING' | 'COMPLETED', ratingOverride?: number) => {
    let bookId = libraryBook?.id;
    if (!libraryBook) {
      // Add to library first
      const newBook = addBook(
        richDetail.title,
        richDetail.author,
        richDetail.totalPages,
        richDetail.category,
        richDetail.coverImage
      );
      bookId = newBook?.id;
    }

    if (bookId) {
      const targetPage = status === 'COMPLETED' ? richDetail.totalPages : 0;
      updateProgress(bookId, targetPage, status, ratingOverride);
    }
    setShowShelfDropdown(false);
  };

  const handleRateBook = (rating: number) => {
    setAnimatingStar(rating);
    setUserRating(rating);
    // Mark as read/completed when rated
    handleShelfChange('COMPLETED', rating);
    setTimeout(() => {
      setAnimatingStar(null);
    }, 450);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?book=${encodeURIComponent(selectedBook.id)}&title=${encodeURIComponent(richDetail.title)}&author=${encodeURIComponent(richDetail.author)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: richDetail.title,
          text: `Lihat buku "${richDetail.title}" oleh ${richDetail.author} di AKRA Apps!`,
          url: shareUrl,
        });
      } catch (err) {
        logger.warn('book.share_failed', { error: err });
      }
    } else if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast(language === 'id' ? 'Tautan buku disalin ke papan klip!' : 'Book link copied to clipboard!', 'success');
      } catch (err) {
        logger.warn('book.clipboard_write_failed', { error: err });
        showToast(language === 'id' ? 'Gagal menyalin tautan.' : 'Failed to copy link.', 'error');
      }
    }
  };

  // Helper to render filled/empty stars for average rating
  const renderAverageStars = (rating: number) => {
    const rounded = Math.round(rating);
    return (
      <div className="flex text-amber-500 gap-0.5 shrink-0">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={16}
            fill={s <= rounded ? "currentColor" : "none"}
            className="stroke-1"
          />
        ))}
      </div>
    );
  };

  // Format numbers to Indonesian locale format
  const formatNumber = (num: number) => num.toLocaleString('id-ID');

  // Slice description for "Show more"
  const paragraphs = richDetail.description.split('\n\n');
  const needsTruncation = paragraphs.length > 1 || richDetail.description.length > 180;
  const displayDescription = isDescExpanded 
    ? richDetail.description 
    : (paragraphs[0].length > 180 ? paragraphs[0].substring(0, 180) + '...' : paragraphs[0]);

  // Loading Skeleton State UI
  if (isLoading) {
    return (
      <div className="w-full bg-white p-6 md:p-8 rounded-xl border border-border-light-gray shadow-xs text-[#181818] max-w-[950px] mx-auto">
        {/* Back Button Skeleton */}
        <div className="skeleton w-24 h-8.5 mb-6" />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-start">
          {/* Left Column Skeleton */}
          <div className="flex flex-col items-center md:items-start gap-5">
            <div className="skeleton w-[180px] h-[260px] md:w-[200px] md:h-[290px]" />
            <div className="skeleton w-full h-10" />
            <div className="skeleton w-full h-10" />
            <div className="skeleton w-32 h-5 mt-2" />
          </div>

          {/* Right Column Skeleton */}
          <div className="flex flex-col gap-4 w-full">
            <div className="skeleton w-3/4 h-10 mb-2" />
            <div className="skeleton w-1/4 h-5 mb-4" />
            <div className="skeleton w-1/2 h-6 mb-6" />
            <div className="flex flex-col gap-2">
              <div className="skeleton w-full h-4" />
              <div className="skeleton w-full h-4" />
              <div className="skeleton w-5/6 h-4" />
            </div>
            <div className="skeleton w-2/3 h-5 mt-4" />
            <div className="skeleton w-1/3 h-4 mt-2" />
            <div className="skeleton w-full h-8 mt-6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 md:p-8 rounded-xl border border-border-light-gray shadow-xs animate-fade-in text-[#181818] max-w-[950px] mx-auto">
      
      {/* Back Button */}
      <button
        onClick={() => setCurrentTab(previousTab)}
        className="flex items-center gap-2 mb-6 text-xs font-bold text-text-slate-dark hover:text-brand-orange cursor-pointer transition-colors border border-border-light-gray bg-white py-2 px-4 rounded-full shadow-2xs hover:shadow-xs hover:border-brand-orange/30 transition-all active-pop hover-scale"
      >
        <ArrowLeft size={14} className="text-brand-orange" />
        {language === 'id' ? 'Kembali' : 'Back'}
      </button>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-start">
        
        {/* ================= LEFT COLUMN: COVER & ACTIONS ================= */}
        <div className="flex flex-col items-center md:items-start gap-5">
          {/* Book Cover */}
          <div className="relative group w-[180px] h-[260px] md:w-[200px] md:h-[290px] rounded-lg overflow-hidden shadow-md border border-border-light-gray shrink-0 bg-gray-50 transition-all duration-300 hover:shadow-lg hover-scale cursor-pointer">
            <BookCover
              src={richDetail.coverImage}
              alt={richDetail.title}
              width={200}
              height={290}
              priority
              className="w-full h-full object-cover"
            />
          </div>

          {/* Shelf Selection Button Container */}
          <div className="w-full relative" ref={shelfDropdownRef}>
            <div className="flex w-full items-stretch rounded-md border border-border-light-gray h-10 shadow-2xs overflow-hidden active-pop">
              <button
                type="button"
                onClick={() => {
                  if (currentShelf) {
                    // Toggle dropdown if already in library
                    setShowShelfDropdown(!showShelfDropdown);
                  } else {
                    // Default to Want to Read
                    handleShelfChange('WANT_TO_READ');
                  }
                }}
                className={`flex-1 px-3 flex items-center justify-center gap-2 text-xs font-bold transition-colors border-none cursor-pointer ${
                  currentShelf 
                    ? 'bg-gray-100 text-text-slate-dark hover:bg-gray-200' 
                    : 'bg-brand-forest hover:bg-brand-forest-hover text-white'
                }`}
              >
                {currentShelf ? (
                  <>
                    <Check size={14} className="text-brand-green" />
                    <span>
                      {currentShelf === 'WANT_TO_READ' && translations[language].wantToRead}
                      {currentShelf === 'READING' && translations[language].currentlyReading}
                      {currentShelf === 'COMPLETED' && translations[language].read}
                    </span>
                  </>
                ) : (
                  <>
                    <Pen size={12} />
                    <span>{translations[language].wantToRead}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                aria-label={language === 'id' ? 'Pilih rak buku' : 'Choose bookshelf'}
                onClick={() => setShowShelfDropdown(!showShelfDropdown)}
                className={`px-2 flex items-center justify-center border-l transition-colors cursor-pointer border-none ${
                  currentShelf 
                    ? 'bg-gray-100 hover:bg-gray-200 border-border-light-gray text-text-slate-medium' 
                    : 'bg-brand-forest hover:bg-brand-forest-hover border-white/20 text-white'
                }`}
              >
                <ChevronDown size={14} className={`transition-transform duration-200 ${showShelfDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Shelf Dropdown Overlay */}
            {showShelfDropdown && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-border-light-gray rounded-md shadow-md flex flex-col p-1 z-40 divide-y divide-border-light-gray/50 animate-fade-in">
                {([
                  { id: 'WANT_TO_READ', label: translations[language].wantToRead },
                  { id: 'READING', label: translations[language].currentlyReading },
                  { id: 'COMPLETED', label: translations[language].read }
                ] as const).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleShelfChange(option.id)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-text-slate-medium hover:bg-gray-50 hover:text-text-slate-dark transition-all border-none bg-transparent cursor-pointer flex items-center justify-between"
                  >
                    <span>{option.label}</span>
                    {currentShelf === option.id && <Check size={12} className="text-brand-green" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progress Update Block */}
          {currentShelf === 'READING' && libraryBook && (
            <div className="w-full flex flex-col gap-2.5 mt-3.5 p-3 bg-gray-50 border border-border-light-gray rounded-xl">
              <ProgressBar value={progress ? progress.currentPage : 0} max={richDetail.totalPages || 200} color="emerald" />
              
              <div className="flex gap-2 items-center mt-1">
                <div className="flex-1 flex items-center gap-1 bg-white border border-border-light-gray rounded-lg px-2 h-8">
                  <input
                    type="number"
                    aria-label={language === 'id' ? 'Halaman saat ini' : 'Current page'}
                    min={0}
                    max={richDetail.totalPages || 200}
                    value={inputPage !== undefined ? inputPage : (progress ? progress.currentPage : 0)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setInputPage(isNaN(val) ? 0 : val);
                    }}
                    className="w-full text-xs font-bold text-text-slate-dark text-center border-none bg-transparent focus-visible:ring-2 focus-visible:ring-brand-orange/40 rounded"
                  />
                  <span className="text-[10px] text-text-slate-light font-bold shrink-0">/ {richDetail.totalPages || 200} {translations[language].pagesOf}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const val = inputPage !== undefined ? inputPage : (progress ? progress.currentPage : 0);
                    updateProgress(libraryBook.id, val, 'READING');
                  }}
                  className="bg-brand-green hover:bg-[#2c6e48] text-white border-none rounded-lg px-3 h-8 cursor-pointer flex items-center justify-center font-bold text-xs transition-colors shrink-0 shadow-xs"
                >
                  {translations[language].simpan}
                </button>
              </div>
            </div>
          )}

          {/* Rate this Book Stars */}
          <div className="flex flex-col items-center w-full gap-1.5 mt-1 border-t border-border-light-gray/60 pt-4 select-none">
            <div className="flex text-gray-200" role="radiogroup" aria-label={translations[language].rateThisBook}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRateBook(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${star} ${language === 'id' ? 'bintang' : 'stars'}`}
                  className="bg-transparent border-none p-0.5 cursor-pointer"
                >
                  <Star
                    size={20}
                    className={`transition-all hover:scale-120 duration-150 ${
                      star <= (hoverRating || displayedUserRating) 
                        ? "text-yellow-500 fill-current" 
                        : "text-gray-300"
                    } ${animatingStar === star ? 'animate-pop' : ''}`}
                  />
                </button>
              ))}
            </div>
            <span className="text-[11px] text-text-slate-medium font-medium">{translations[language].rateThisBook}</span>
          </div>

        </div>

        {/* ================= RIGHT COLUMN: MAIN CONTENT ================= */}
        <div className="flex flex-col gap-4">
          
          {/* Header Row: Title & Share Icon */}
          <div className="flex justify-between items-start gap-4">
            <h1 className="font-serif font-bold text-3xl md:text-4xl text-[#181818] leading-tight">
              {richDetail.title}
            </h1>
            <button
              onClick={handleShare}
              className="p-2 border border-border-light-gray rounded-full bg-white hover:bg-gray-50 text-text-slate-medium hover:text-brand-orange cursor-pointer transition-all shadow-2xs shrink-0 mt-1 active-pop hover-scale"
              title="Bagikan Buku"
            >
              <Share2 size={16} />
            </button>
          </div>

          {/* Author with Verified Badge */}
          <div className="text-md text-[#181818] flex items-center gap-1.5 font-sans">
            <span className="font-bold text-text-slate-dark hover:underline cursor-pointer">
              {richDetail.author}
            </span>
            <span className="w-4 h-4 rounded-full bg-[#5c4033] text-white flex items-center justify-center text-[9px] font-bold shadow-2xs" title="Verified Author">
              ✓
            </span>
          </div>

          {/* Ratings Stats */}
          {richDetail.ratingsCount > 0 ? (
            <div className="flex items-center flex-wrap gap-2 text-xs py-1">
              {renderAverageStars(richDetail.rating)}
              <span className="font-bold text-sm text-[#181818] ml-1">{richDetail.rating.toFixed(2)}</span>
              <span className="text-text-slate-light">•</span>
              <span className="text-text-slate-medium">
                {formatNumber(richDetail.ratingsCount)} {language === 'id' ? 'penilaian' : 'ratings'}
              </span>
            </div>
          ) : (
            <div className="text-xs text-text-slate-medium py-1 italic font-medium">
              {translations[language].noPenilaian}
            </div>
          )}

          {/* Tagline */}
          {richDetail.tagline && (
            <p className="text-[#181818] font-bold text-sm leading-relaxed">
              {richDetail.tagline}
            </p>
          )}

          {/* Collapsible Description */}
          <div className="flex flex-col gap-2">
            <p className="text-sm text-[#333333] leading-relaxed whitespace-pre-line font-normal transition-all duration-300">
              {displayDescription}
            </p>
            {needsTruncation && (
              <button
                type="button"
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-xs font-bold text-text-slate-dark hover:text-brand-orange bg-transparent border-none cursor-pointer flex items-center gap-1 self-start p-0 mt-1 active-pop"
              >
                <span>{isDescExpanded ? (language === 'id' ? 'Tampilkan lebih sedikit' : 'Show less') : (language === 'id' ? 'Tampilkan lebih banyak' : 'Show more')}</span>
                {isDescExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>

          {/* Genres List */}
          <div className="flex flex-wrap gap-y-1 items-baseline mt-2 text-xs">
            <span className="text-text-slate-light font-medium min-w-[70px]">Genres</span>
            <div className="flex flex-wrap gap-x-2 gap-y-1 pl-1">
              {richDetail.genres.map((genre, idx) => (
                <span 
                  key={idx} 
                  className="text-[#348055] font-semibold underline underline-offset-3 hover:text-[#409d69] cursor-pointer hover:scale-105 transition-transform inline-block"
                >
                  {genre}
                </span>
              ))}
              {richDetail.genres.length > 5 && (
                <span className="text-[#348055] font-semibold underline underline-offset-3 hover:text-[#409d69] cursor-pointer hover:scale-105 transition-transform inline-block">
                  ...more
                </span>
              )}
            </div>
          </div>

          {/* Metadata Block (Pages, Binding, Published) */}
          <div className="flex flex-col gap-1 text-xs text-text-slate-medium mt-1">
            <p className="font-medium text-[#181818]">
              {richDetail.totalPages} {translations[language].pagesOf}, {richDetail.binding}
            </p>
            <p className="text-text-slate-light">
              {translations[language].firstPublished} {richDetail.publishedDate}
            </p>
          </div>

          {/* Collapsible Book Details & Editions */}
          <div className="border-t border-border-light-gray/60 pt-3 mt-1 w-full">
            <button
              type="button"
              onClick={() => setIsEditionsExpanded(!isEditionsExpanded)}
              className="w-full text-left font-bold text-xs text-text-slate-dark hover:text-brand-orange bg-transparent border-none cursor-pointer flex items-center justify-between py-1 active-pop"
            >
              <span>{translations[language].bookDetailsEditions}</span>
              {isEditionsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isEditionsExpanded && (
              <div className="mt-3 pl-3 border-l border-border-light-gray flex flex-col gap-2.5 text-xs text-text-slate-medium animate-slide-in">
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="font-semibold text-[#181818]">ISBN:</span>
                  <span>9789792261882 (ISBN10: 9792261883)</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="font-semibold text-[#181818]">{language === 'id' ? 'Format:' : 'Format:'}</span>
                  <span>{richDetail.binding} (Reprint Edition)</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="font-semibold text-[#181818]">{language === 'id' ? 'Penerbit:' : 'Publisher:'}</span>
                  <span>Gramedia Pustaka Utama</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="font-semibold text-[#181818]">{language === 'id' ? 'Bahasa:' : 'Language:'}</span>
                  <span>{language === 'id' ? 'Bahasa Indonesia' : 'Indonesian'}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="font-semibold text-[#181818]">Characters:</span>
                  <span>Tanya, Dede, Ibu, Danar</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 flex-wrap">
                  <span className="font-semibold text-[#181818]">Setting:</span>
                  <span>Jakarta, Indonesia</span>
                </div>
              </div>
            )}
          </div>

          {/* Readership stats (avatars + text) */}
          <div className="flex flex-col gap-3 mt-2 text-xs border-t border-b border-border-light-gray/40 py-3.5">
            {(currentlyReadingCount > 0 || wantToReadCount > 0 || completedCount > 0) ? (
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6">
                {currentlyReadingCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {users
                        .filter(u => appProgressesForThisBook.some(p => p.userId === u.id && p.status === 'READING'))
                        .slice(0, 3)
                        .map(u => (
                          <UserAvatar key={u.id} src={u.avatar} alt={u.displayName} width={20} height={20} className="w-5 h-5 rounded-full object-cover border border-white" title={u.displayName} />
                        ))}
                    </div>
                    <span className="text-text-slate-medium font-medium">
                      <strong className="text-text-slate-dark">{currentlyReadingCount}</strong> {translations[language].sedangMembaca}
                    </span>
                  </div>
                )}

                {wantToReadCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {users
                        .filter(u => appProgressesForThisBook.some(p => p.userId === u.id && p.status === 'WANT_TO_READ'))
                        .slice(0, 3)
                        .map(u => (
                          <UserAvatar key={u.id} src={u.avatar} alt={u.displayName} width={20} height={20} className="w-5 h-5 rounded-full object-cover border border-white" title={u.displayName} />
                        ))}
                    </div>
                    <span className="text-text-slate-medium font-medium">
                      <strong className="text-text-slate-dark">{wantToReadCount}</strong> {translations[language].inginMembaca}
                    </span>
                  </div>
                )}

                {completedCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {users
                        .filter(u => appProgressesForThisBook.some(p => p.userId === u.id && p.status === 'COMPLETED'))
                        .slice(0, 3)
                        .map(u => (
                          <UserAvatar key={u.id} src={u.avatar} alt={u.displayName} width={20} height={20} className="w-5 h-5 rounded-full object-cover border border-white" title={u.displayName} />
                        ))}
                    </div>
                    <span className="text-text-slate-medium font-medium">
                      <strong className="text-text-slate-dark">{completedCount}</strong> {translations[language].selesaiMembaca}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-text-slate-medium font-medium italic">
                {translations[language].noAppUsersProgress}
              </span>
            )}
          </div>

          {/* About the author */}
          <div className="border-t border-border-light-gray/60 pt-5 mt-2">
            <h3 className="font-serif text-lg font-bold text-[#181818] mb-4">{translations[language].aboutAuthor}</h3>
            <div className="flex items-start gap-4">
              <UserAvatar 
                src={richDetail.authorAvatar || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80"} 
                alt={richDetail.author} 
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover shrink-0 border border-border-light-gray" 
              />
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#181818] hover:underline cursor-pointer text-sm">
                      {richDetail.author}
                    </span>
                    <span className="w-4 h-4 rounded-full bg-[#5c4033] text-white flex items-center justify-center text-[9px] font-bold shadow-2xs" title="Verified Author">
                      ✓
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const isFollowed = followedAuthors.includes(richDetail.author);
                      setFollowedAuthors((prev) =>
                        isFollowed
                          ? prev.filter((a) => a !== richDetail.author)
                          : [...prev, richDetail.author]
                      );
                      showToast(
                        isFollowed
                          ? (language === 'id' ? `Berhenti mengikuti ${richDetail.author}` : `Unfollowed ${richDetail.author}`)
                          : (language === 'id' ? `Mengikuti ${richDetail.author}` : `Following ${richDetail.author}`),
                        'success'
                      );
                    }}
                    className={`px-5 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer border-none shadow-xs active-pop ${
                      followedAuthors.includes(richDetail.author)
                        ? 'bg-brand-orange text-white hover:bg-brand-orange-hover'
                        : 'text-white bg-black hover:bg-neutral-800'
                    }`}
                  >
                    {followedAuthors.includes(richDetail.author)
                      ? (language === 'id' ? 'Mengikuti' : 'Following')
                      : 'Follow'}
                  </button>
                </div>
                
                <p className="text-text-slate-light text-[11px] font-semibold mb-2">
                  {richDetail.authorStats || "86 books · 11.9k followers"}
                </p>

                <p className="text-xs text-[#333333] leading-relaxed">
                  {richDetail.authorBio || `${richDetail.author} is a passionate author and thought leader.`}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ================= Buddy Reads (Membaca Bersama Teman) ================= */}
      <BuddyReadSection
        selectedBook={selectedBook}
        libraryBook={libraryBook}
        richDetail={richDetail}
        currentUser={currentUser}
        users={users}
        readingProgress={readingProgress}
        buddyReads={buddyReads}
        buddyMessages={buddyMessages}
        language={language}
        addBook={addBook}
        startBuddyRead={startBuddyRead}
        addBuddyMessage={addBuddyMessage}
      />

      {/* ================= SIMILAR BOOKS (Mungkin Juga Kamu Suka) ================= */}
      {(() => {
        // Find books in the same category, excluding the current book
        const similarBooks = books.filter(b => 
          b.id !== (libraryBook?.id || selectedBook.id) &&
          (b.category === richDetail.category || b.author === richDetail.author)
        ).slice(0, 6);

        const allSimilar = similarBooks.map(b => ({ ...b, rating: 4.0 }));

        if (allSimilar.length === 0) return null;

        return (
          <div className="border-t border-border-light-gray/60 pt-6 mt-8">
            <h3 className="text-sm font-extrabold text-text-slate-dark uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>✨</span> Mungkin Juga Kamu Suka
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory">
              {allSimilar.map((book, idx) => (
                <button
                  type="button"
                  key={book.id || idx}
                  onClick={() => {
                    // If it's a real library book, navigate to it
                    const realBook = books.find(b => b.id === book.id);
                    if (realBook) viewBookDetails(realBook);
                  }}
                  className="text-left bg-transparent border-none p-0 flex flex-col gap-2 min-w-[110px] max-w-[110px] shrink-0 snap-start cursor-pointer group"
                >
                  <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-border-light-gray shadow-2xs group-hover:shadow-sm transition-all bg-gray-50">
                    <BookCover
                      src={book.coverImage}
                      alt={book.title}
                      width={110}
                      height={165}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Rating badge */}
                    <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <span className="text-yellow-400">★</span>
                      <span>{book.rating?.toFixed(1) || '4.0'}</span>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-text-slate-dark truncate group-hover:text-brand-orange transition-colors leading-tight">
                      {book.title}
                    </h5>
                    <p className="text-[10px] text-text-slate-medium truncate">{book.author}</p>
                    <span className="text-[9px] text-brand-orange font-bold bg-brand-orange-glow px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                      {book.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

    </div>
  );
};
