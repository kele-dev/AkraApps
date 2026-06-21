"use client";

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { Plus, CheckCircle, Clock, ListPlus } from 'lucide-react';

export const Books: React.FC = () => {
  const { books, readingProgress, updateProgress, addBook } = useApp();

  // Tabs for Shelves
  const [shelfTab, setShelfTab] = useState<'ALL' | 'READING' | 'COMPLETED' | 'WANT_TO_READ'>('ALL');

  // Book Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState<number>(200);
  const [category, setCategory] = useState('');

  // Log Progress State
  const [activeLogBookId, setActiveLogBookId] = useState<string | null>(null);
  const [logPage, setLogPage] = useState<number>(0);

  // Find progress for a specific book
  const getBookProgress = (bookId: string) => {
    return readingProgress.find((p) => p.userId === '1' && p.bookId === bookId);
  };

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || totalPages <= 0) return;

    addBook(title, author, totalPages, category || 'Umum');
    setTitle('');
    setAuthor('');
    setTotalPages(200);
    setCategory('');
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
            <h3 className="text-base font-bold text-text-slate-dark mb-1">
              Masukkan Detail Buku
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-slate-medium mb-1.5">Judul Buku</label>
                <input
                  type="text"
                  className="input-field w-full px-3 py-2 rounded-md border border-border-light-gray text-sm focus:outline-none"
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
                  className="input-field w-full px-3 py-2 rounded-md border border-border-light-gray text-sm focus:outline-none"
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
                  className="input-field w-full px-3 py-2 rounded-md border border-border-light-gray text-sm focus:outline-none"
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
                  className="input-field w-full px-3 py-2 rounded-md border border-border-light-gray text-sm focus:outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Misal: Filsafat, Fiksi, Sains"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
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
