"use client";

import React, { useState, useEffect } from 'react';
import { useApp, translations } from '../../context/AppContext';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { Plus, CheckCircle, Clock, ListPlus } from 'lucide-react';
import { searchBooksHybrid } from '../../lib/bookApi';

export const Books: React.FC = () => {
  const { 
    books, 
    readingProgress, 
    updateProgress, 
    addBook, 
    globalSearchQuery, 
    setGlobalSearchQuery,
    selectedBookSuggestion,
    setSelectedBookSuggestion,
    currentUser,
    viewBookDetails,
    language
  } = useApp();

  // Tabs for Shelves
  const [shelfTab, setShelfTab] = useState<'ALL' | 'READING' | 'COMPLETED' | 'WANT_TO_READ'>('ALL');

  // Book Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState<number>(200);
  const [category, setCategory] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchWarning, setSearchWarning] = useState('');
  const [pagesRead, setPagesRead] = useState<number>(0);
  const [isManualInput, setIsManualInput] = useState<boolean>(false);

  // Log Progress State
  const [activeLogBookId, setActiveLogBookId] = useState<string | null>(null);
  const [logPage, setLogPage] = useState<number>(0);

  // Find progress for a specific book
  const getBookProgress = (bookId: string) => {
    return readingProgress.find((p) => p.userId === currentUser.id && p.bookId === bookId);
  };

  // There is no local catalog to fall back to: report the state, keep results empty.
  const showSearchFallback = (warningMsg: string) => {
    setSearchWarning(warningMsg);
    setSearchResults([]);
  };

  const handleApiSearch = async (overrideQuery?: string) => {
    const queryToUse = (typeof overrideQuery === 'string' ? overrideQuery : searchQuery) || '';
    if (!queryToUse.trim()) return;
    setIsSearching(true);
    setSearchWarning('');
    try {
      const results = await searchBooksHybrid(queryToUse, 5);
      
      if (results.length > 0) {
        setSearchResults(results);
      } else {
        showSearchFallback(language === 'id' ? "Buku tidak ditemukan." : "Book not found.");
      }
    } catch (e) {
      console.warn("Pencarian API gagal:", e);
      showSearchFallback(language === 'id' ? "Pencarian gagal / Offline." : "Search failed / Offline.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (book: any) => {
    setTitle(book.title);
    setAuthor(book.author);
    setTotalPages(book.totalPages);
    setCategory(book.category);
    setCoverImage(book.coverImage);
    setSearchResults([]);
    setSearchQuery('');
    setSearchWarning('');
    setIsManualInput(false);
    setPagesRead(0);
  };

  useEffect(() => {
    if (globalSearchQuery.trim()) {
      setShowAddForm(true);
      setSearchQuery(globalSearchQuery);
      handleApiSearch(globalSearchQuery);
      setGlobalSearchQuery('');
    }
  }, [globalSearchQuery]);

  useEffect(() => {
    if (selectedBookSuggestion) {
      setShowAddForm(true);
      setTitle(selectedBookSuggestion.title);
      setAuthor(selectedBookSuggestion.author);
      setTotalPages(selectedBookSuggestion.totalPages);
      setCategory(selectedBookSuggestion.category || '');
      setCoverImage(selectedBookSuggestion.coverImage || '');
      setIsManualInput(false);
      setPagesRead(0);
      setSelectedBookSuggestion(null);
    }
  }, [selectedBookSuggestion]);

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || totalPages <= 0) return;

    const newBook = addBook(title, author, totalPages, category || (language === 'id' ? 'Umum' : 'General'), coverImage || undefined);
    
    // Automatically log progress if pagesRead > 0
    if (newBook && pagesRead > 0) {
      const pageNum = Math.min(pagesRead, totalPages);
      const status = pageNum === totalPages ? 'COMPLETED' : 'READING';
      updateProgress(newBook.id, pageNum, status);
    }

    setTitle('');
    setAuthor('');
    setTotalPages(200);
    setCategory('');
    setCoverImage('');
    setSearchQuery('');
    setSearchResults([]);
    setPagesRead(0);
    setIsManualInput(false);
    setShowAddForm(false);
  };

  const handleCloseForm = () => {
    setTitle('');
    setAuthor('');
    setTotalPages(200);
    setCategory('');
    setCoverImage('');
    setSearchQuery('');
    setSearchResults([]);
    setPagesRead(0);
    setIsManualInput(false);
    setShowAddForm(false);
  };

  const handleLogProgressSubmit = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    // Boundary check
    const pageNum = Math.max(0, Math.min(logPage, book.totalPages));
    const status = pageNum === book.totalPages ? 'COMPLETED' : 'READING';
    
    updateProgress(bookId, pageNum, status);
    setActiveLogBookId(null);
  };

  const startLoggingProgress = (bookId: string, currentP: number) => {
    setActiveLogBookId(bookId);
    setLogPage(currentP);
  };

  // Filter books based on shelfTab
  const filteredBooks = books.filter((book) => {
    const progress = getBookProgress(book.id);
    const status = progress ? progress.status : 'WANT_TO_READ';

    if (shelfTab === 'ALL') return true;
    return status === shelfTab;
  });

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* Header Row */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-text-slate-dark mb-1">
            {translations[language].libraryTitle}
          </h2>
          <p className="text-text-slate-medium text-sm">
            {translations[language].libraryDesc}
          </p>
        </div>
      </div>

      {/* Shelf Filter Navigation */}
      <div className="flex gap-2 border-b border-border-light-gray pb-2 overflow-x-auto">
        {[
          { id: 'ALL', label: translations[language].allBooks },
          { id: 'READING', label: translations[language].currentlyReadingShelf },
          { id: 'COMPLETED', label: translations[language].completedShelf },
          { id: 'WANT_TO_READ', label: translations[language].wantToReadShelf },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setShelfTab(tab.id as any)}
            className={`px-4 py-2 border-none font-bold cursor-pointer whitespace-nowrap text-xs rounded-md transition-all border-b-2 ${
              shelfTab === tab.id 
                ? 'bg-gray-100 text-text-slate-dark border-brand-orange' 
                : 'bg-transparent text-text-slate-medium border-transparent hover:text-text-slate-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredBooks.map((book) => {
          const progress = getBookProgress(book.id);
          const currentPage = progress ? progress.currentPage : 0;
          const status = progress ? progress.status : 'WANT_TO_READ';

          return (
            <Card key={book.id} hoverable={false} className="flex flex-col h-full p-5">
              
              {/* Top info: Cover and text */}
              <div className="flex gap-4 mb-5">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  onClick={() => viewBookDetails(book)}
                  className="w-20 h-28 object-cover rounded-md shadow-xs border border-border-light-gray cursor-pointer hover:opacity-85 transition-opacity"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-start">
                  <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-md text-text-slate-medium uppercase font-extrabold inline-block mb-1.5 self-start">
                    {book.category || 'Umum'}
                  </span>
                  <h4 
                    onClick={() => viewBookDetails(book)}
                    className="text-sm font-bold text-text-slate-dark mb-0.5 truncate cursor-pointer hover:text-brand-orange hover:underline"
                  >
                    {book.title}
                  </h4>
                  <p className="text-xs text-text-slate-medium mb-3 truncate">
                    {book.author}
                  </p>
                  
                  {/* Status Badge */}
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                    {status === 'READING' && (
                      <span className="text-brand-green flex items-center gap-1">
                        <Clock size={12} /> {translations[language].currentlyReadingShelf}
                      </span>
                    )}
                    {status === 'COMPLETED' && (
                      <span className="text-brand-orange flex items-center gap-1">
                        <CheckCircle size={12} /> {translations[language].completedShelf}
                      </span>
                    )}
                    {status === 'WANT_TO_READ' && (
                      <span className="text-text-slate-light flex items-center gap-1">
                        <ListPlus size={12} /> {translations[language].wantToReadShelf}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress visualizer */}
              <div className="mt-auto flex flex-col gap-4">
                {status !== 'WANT_TO_READ' ? (
                  <ProgressBar 
                    value={currentPage} 
                    max={book.totalPages} 
                    color={status === 'COMPLETED' ? 'gold' : 'emerald'}
                  />
                ) : (
                  <div className="text-xs text-text-slate-light leading-relaxed">
                    {language === 'id' ? 'Buku ini ada di daftar antrean bacaan Anda.' : 'This book is in your reading queue.'}
                  </div>
                )}

                {/* Progress Logger Input Toggle */}
                {activeLogBookId === book.id ? (
                  <div className="flex flex-col gap-2 p-3 bg-bg-light-gray rounded-md border border-border-light-gray">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-slate-medium font-medium">{translations[language].currentPage}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={logPage}
                          onChange={(e) => setLogPage(parseInt(e.target.value) || 0)}
                          max={book.totalPages}
                          min={0}
                          className="w-12 bg-white text-text-slate-dark border border-border-light-gray rounded-md p-1 text-center font-bold focus:outline-none"
                        />
                        <span className="text-text-slate-light">/ {book.totalPages}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end mt-1">
                      <button 
                        type="button" 
                        className="btn-secondary py-0.5 px-2 text-[10px]" 
                        onClick={() => setActiveLogBookId(null)}
                      >
                        {translations[language].cancel}
                      </button>
                      <button 
                        type="button" 
                        className="btn-primary py-0.5 px-2 text-[10px]" 
                        onClick={() => handleLogProgressSubmit(book.id)}
                      >
                        {translations[language].simpan}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="btn-secondary w-full justify-center text-xs py-1.5 px-3" 
                    onClick={() => startLoggingProgress(book.id, currentPage)}
                  >
                    {status === 'WANT_TO_READ' 
                      ? (language === 'id' ? 'Mulai Membaca' : 'Start Reading') 
                      : (language === 'id' ? 'Perbarui Progres' : 'Update Progress')}
                  </button>
                )}
              </div>

            </Card>
          );
        })}
      </div>

    </div>
  );
};
