"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { Plus, CheckCircle, Clock, ListPlus } from 'lucide-react';

export const LOCAL_BOOK_DATABASE = [
  { id: 'l1', title: 'Bumi', author: 'Tere Liye', coverImage: 'https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?auto=format&fit=crop&w=300&q=80', totalPages: 440, category: 'Fiksi' },
  { id: 'l2', title: 'Laskar Pelangi', author: 'Andrea Hirata', coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80', totalPages: 529, category: 'Fiksi' },
  { id: 'l3', title: 'Filosofi Teras', author: 'Henry Manampiring', coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80', totalPages: 320, category: 'Filsafat' },
  { id: 'l4', title: 'Atomic Habits', author: 'James Clear', coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=300&q=80', totalPages: 320, category: 'Self-Improvement' },
  { id: 'l5', title: 'Sapiens: Riwayat Singkat Umat Manusia', author: 'Yuval Noah Harari', coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=300&q=80', totalPages: 520, category: 'Sejarah' },
  { id: 'l6', title: 'Dilan: Dia adalah Dilanku Tahun 1990', author: 'Pidi Baiq', coverImage: 'https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?auto=format&fit=crop&w=300&q=80', totalPages: 330, category: 'Fiksi' },
  { id: 'l7', title: 'Gadis Kretek', author: 'Ratih Kumala', coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80', totalPages: 274, category: 'Fiksi' },
  { id: 'l8', title: 'Bicara Pancasila', author: 'Yudi Latif', coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=300&q=80', totalPages: 412, category: 'Sejarah' },
  { id: 'l9', title: 'Home Sweet Loan', author: 'Almira Bastari', coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80', totalPages: 312, category: 'Fiksi' }
];

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
    currentUser
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

  // Log Progress State
  const [activeLogBookId, setActiveLogBookId] = useState<string | null>(null);
  const [logPage, setLogPage] = useState<number>(0);

  // Find progress for a specific book
  const getBookProgress = (bookId: string) => {
    return readingProgress.find((p) => p.userId === currentUser.id && p.bookId === bookId);
  };

  const triggerLocalFallback = (warningMsg: string, queryToUse?: string) => {
    setSearchWarning(warningMsg);
    const q = (typeof queryToUse === 'string' ? queryToUse : searchQuery).toLowerCase();
    const filtered = LOCAL_BOOK_DATABASE.filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
    setSearchResults(filtered);
  };

  const handleApiSearch = async (overrideQuery?: string) => {
    const queryToUse = (typeof overrideQuery === 'string' ? overrideQuery : searchQuery) || '';
    if (!queryToUse.trim()) return;
    setIsSearching(true);
    setSearchWarning('');
    try {
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(queryToUse)}&limit=5`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.docs && data.docs.length > 0) {
        const results = data.docs.map((doc: any) => {
          const cover = doc.cover_i 
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            : "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80";
          return {
            id: doc.key || `ol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: doc.title || "Judul Tidak Diketahui",
            author: doc.author_name ? doc.author_name.join(", ") : "Penulis Tidak Diketahui",
            coverImage: cover,
            totalPages: doc.number_of_pages_median || 200,
            category: doc.subject ? doc.subject[0] : "Umum"
          };
        });
        setSearchResults(results);
      } else {
        triggerLocalFallback("Buku tidak ditemukan di Open Library. Menampilkan hasil pencarian dari database lokal.", queryToUse);
      }
    } catch (e) {
      console.warn("Pencarian Open Library API gagal, beralih ke lokal:", e);
      triggerLocalFallback("Pencarian Open Library gagal / Offline. Menampilkan hasil pencarian dari database lokal.", queryToUse);
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
      setSelectedBookSuggestion(null);
    }
  }, [selectedBookSuggestion]);

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || totalPages <= 0) return;

    addBook(title, author, totalPages, category || 'Umum', coverImage || undefined);
    setTitle('');
    setAuthor('');
    setTotalPages(200);
    setCategory('');
    setCoverImage('');
    setSearchQuery('');
    setSearchResults([]);
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
            Perpustakaan Saya
          </h2>
          <p className="text-text-slate-medium text-sm">
            Kelola koleksi buku Anda dan catat progres membaca harian.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} />
          Tambah Buku Baru
        </button>
      </div>

      {/* Add Custom Book Form */}
      {showAddForm && (
        <Card hoverable={false} className="border border-brand-orange">
          <form onSubmit={handleAddBook} className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-border-light-gray pb-2">
              <h3 className="text-base font-bold text-text-slate-dark">
                Tambah Buku Baru
              </h3>
              <span className="text-xs text-text-slate-medium">
                Cari otomatis atau isi manual di bawah
              </span>
            </div>

            {/* Open Library API Search Section */}
            <div className="bg-bg-light-gray p-4 rounded-lg border border-border-light-gray flex flex-col gap-3">
              <label className="block text-xs font-bold text-brand-orange">
                Cari Buku Otomatis (Open Library API)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field flex-1 px-3 py-2 rounded-md border border-border-light-gray text-xs focus:outline-none bg-white text-text-slate-dark"
                  placeholder="Ketik judul buku, penulis, atau kata kunci..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApiSearch();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleApiSearch()}
                  className="btn-primary py-1.5 px-4 text-xs font-bold"
                  disabled={isSearching}
                >
                  {isSearching ? 'Mencari...' : 'Cari'}
                </button>
              </div>

              {searchWarning && (
                <div className="text-[10px] text-brand-orange bg-brand-orange-glow px-2.5 py-1.5 rounded-md border border-brand-orange/20 mt-0.5 font-semibold animate-fade-in">
                  ⚠️ {searchWarning}
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="border border-border-light-gray rounded-md bg-white max-h-48 overflow-y-auto divide-y divide-border-light-gray shadow-xs mt-1">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => handleSelectSearchResult(result)}
                      className="p-2 flex gap-3 items-center hover:bg-bg-light-gray cursor-pointer transition-colors"
                    >
                      <img
                        src={result.coverImage}
                        alt={result.title}
                        className="w-8 h-11 object-cover rounded-sm border border-border-light-gray"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-text-slate-dark truncate">{result.title}</h4>
                        <p className="text-[10px] text-text-slate-medium truncate">oleh {result.author}</p>
                        <span className="text-[9px] text-text-slate-light">{result.totalPages} hal • {result.category}</span>
                      </div>
                      <span className="text-[10px] text-brand-orange font-bold px-2 py-0.5 border border-brand-orange/30 rounded-md bg-brand-orange-glow shrink-0">
                        Pilih
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cover Image Preview */}
            {coverImage && (
              <div className="flex gap-4 items-center bg-brand-green-glow/5 border border-brand-green/20 p-3 rounded-lg animate-fade-in">
                <img
                  src={coverImage}
                  alt="Cover Preview"
                  className="w-12 h-17 object-cover rounded-md border border-border-light-gray shadow-xs shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] bg-brand-green text-white px-2 py-0.5 rounded-full font-bold inline-block mb-1">SAMPUL BUKU TERPILIH</span>
                  <h4 className="text-xs font-bold text-text-slate-dark truncate">{title || 'Judul Buku'}</h4>
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="text-[10px] text-red-500 font-bold block hover:underline bg-transparent border-none cursor-pointer mt-1 p-0"
                  >
                    Hapus Sampul (Kembali ke default)
                  </button>
                </div>
              </div>
            )}

            {/* Manual Form Fields */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-slate-medium mb-1.5">Judul Buku</label>
                  <input
                    type="text"
                    className="input-field w-full px-3 py-2 rounded-md border border-border-light-gray text-xs focus:outline-none"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Misal: Filosofi Teras"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-text-slate-medium mb-1.5">Penulis</label>
                  <input
                    type="text"
                    className="input-field w-full px-3 py-2 rounded-md border border-border-light-gray text-xs focus:outline-none"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Misal: Henry Manampiring"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-slate-medium mb-1.5">Jumlah Halaman</label>
                  <input
                    type="number"
                    className="input-field w-full px-3 py-2 rounded-md border border-border-light-gray text-xs focus:outline-none"
                    value={totalPages}
                    onChange={(e) => setTotalPages(parseInt(e.target.value) || 0)}
                    min={1}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-slate-medium mb-1.5">Kategori / Genre</label>
                  <input
                    type="text"
                    className="input-field w-full px-3 py-2 rounded-md border border-border-light-gray text-xs focus:outline-none"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Misal: Filsafat, Fiksi, Sains"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2 pt-3 border-t border-border-light-gray">
              <button type="button" className="btn-secondary" onClick={handleCloseForm}>
                Batal
              </button>
              <button type="submit" className="btn-primary">
                Simpan Buku
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Shelf Filter Navigation */}
      <div className="flex gap-2 border-b border-border-light-gray pb-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'Semua Buku' },
          { id: 'READING', label: 'Sedang Dibaca' },
          { id: 'COMPLETED', label: 'Selesai Dibaca' },
          { id: 'WANT_TO_READ', label: 'Ingin Baca' },
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
                  className="w-20 h-28 object-cover rounded-md shadow-xs border border-border-light-gray"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-start">
                  <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-md text-text-slate-medium uppercase font-extrabold inline-block mb-1.5 self-start">
                    {book.category || 'Umum'}
                  </span>
                  <h4 className="text-sm font-bold text-text-slate-dark mb-0.5 truncate">
                    {book.title}
                  </h4>
                  <p className="text-xs text-text-slate-medium mb-3 truncate">
                    {book.author}
                  </p>
                  
                  {/* Status Badge */}
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                    {status === 'READING' && (
                      <span className="text-brand-green flex items-center gap-1">
                        <Clock size={12} /> Sedang dibaca
                      </span>
                    )}
                    {status === 'COMPLETED' && (
                      <span className="text-brand-orange flex items-center gap-1">
                        <CheckCircle size={12} /> Selesai dibaca
                      </span>
                    )}
                    {status === 'WANT_TO_READ' && (
                      <span className="text-text-slate-light flex items-center gap-1">
                        <ListPlus size={12} /> Rencana baca
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
                    Buku ini ada di daftar antrean bacaan Anda.
                  </div>
                )}

                {/* Progress Logger Input Toggle */}
                {activeLogBookId === book.id ? (
                  <div className="flex flex-col gap-2 p-3 bg-bg-light-gray rounded-md border border-border-light-gray">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-slate-medium font-medium">Halaman saat ini:</span>
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
                        Batal
                      </button>
                      <button 
                        type="button" 
                        className="btn-primary py-0.5 px-2 text-[10px]" 
                        onClick={() => handleLogProgressSubmit(book.id)}
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="btn-secondary w-full justify-center text-xs py-1.5 px-3" 
                    onClick={() => startLoggingProgress(book.id, currentPage)}
                  >
                    {status === 'WANT_TO_READ' ? 'Mulai Membaca' : 'Perbarui Progres'}
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
