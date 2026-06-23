"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, MessageSquare, Users, Search, LogOut, User } from 'lucide-react';
import { LOCAL_BOOK_DATABASE } from '../features/Books/Books';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    isLoggedIn, 
    loginWithGoogle, 
    logout, 
    currentTab, 
    setCurrentTab, 
    setViewedUser, 
    setGlobalSearchQuery,
    books,
    posts,
    users,
    setSelectedBookSuggestion
  } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  // Suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Click outside to close Suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const query = localSearch.trim().toLowerCase();

  // Find matching items
  const matchingMyBooks = query 
    ? books.filter(b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query))
    : [];

  const matchingDbBooks = query
    ? LOCAL_BOOK_DATABASE.filter(b => {
        const alreadyInLibrary = books.some(myBook => myBook.title.toLowerCase() === b.title.toLowerCase() && myBook.author.toLowerCase() === b.author.toLowerCase());
        return !alreadyInLibrary && (b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query));
      })
    : [];

  const matchingUsers = query
    ? users.filter(u => u.displayName.toLowerCase().includes(query) || u.username.toLowerCase().includes(query))
    : [];

  const matchingPosts = query
    ? posts.filter(p => p.content.toLowerCase().includes(query) || (p.bookTitle && p.bookTitle.toLowerCase().includes(query)))
    : [];

  const hasSuggestions = matchingMyBooks.length > 0 || matchingDbBooks.length > 0 || matchingUsers.length > 0 || matchingPosts.length > 0;
  const showSuggestionsDropdown = showSuggestions && query.length > 0;

  const navLinks = [
    { id: 'feed', label: 'Home Feed' },
    { id: 'books', label: 'Perpustakaan' },
    { id: 'goals', label: 'Target Baca' },
    { id: 'profile', label: 'Profil Saya' }
  ];

  return (
    <header className="bg-white border-b border-border-light-gray sticky top-0 z-50 h-14 flex justify-center items-center w-full">
      <div className="w-full max-w-[1140px] px-5 flex items-center justify-between h-full">
        
        {/* Left Section: Logo & Nav Links */}
        <div className="flex items-center gap-7">
          {/* Logo */}
          <div 
            onClick={() => {
              setCurrentTab('feed');
              setViewedUser(null);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-white font-extrabold text-lg">
              a
            </div>
            <span className="text-xl font-extrabold text-brand-orange tracking-tight select-none">
              akra
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex gap-4">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setCurrentTab(link.id);
                  setViewedUser(null); // Reset profile viewing when switching tabs
                }}
                className={`background-transparent border-none text-sm cursor-pointer py-1 px-1 border-b-2 transition-all ${
                  currentTab === link.id 
                    ? 'text-text-slate-dark font-bold border-brand-orange' 
                    : 'text-text-slate-medium font-medium border-transparent hover:text-text-slate-dark'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Center Section: Search Bar */}
        <div className="flex-1 max-w-[320px] mx-6 relative" ref={searchContainerRef}>
          <Search 
            size={16} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-slate-light" 
          />
          <input
            type="text"
            className="input-field w-full pl-9 rounded-full h-8.5 text-xs bg-gray-100 border border-transparent py-1.5 focus:outline-none focus:border-brand-orange focus:bg-white transition-all"
            placeholder="Cari buku, kutipan, atau teman..."
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && localSearch.trim()) {
                setGlobalSearchQuery(localSearch);
                setCurrentTab('search');
                setLocalSearch('');
                setShowSuggestions(false);
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
          />

          {showSuggestionsDropdown && (
            <div className="absolute left-0 right-0 mt-1 bg-white/95 backdrop-blur-md border border-border-light-gray rounded-lg shadow-lg max-h-80 overflow-y-auto z-50 divide-y divide-border-light-gray text-xs animate-fade-in">
              {/* Category: Buku Saya */}
              {matchingMyBooks.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-extrabold text-brand-orange uppercase px-2 py-1 mb-1">
                    Buku Saya ({matchingMyBooks.length})
                  </div>
                  {matchingMyBooks.map(b => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setCurrentTab('books');
                        setLocalSearch('');
                        setShowSuggestions(false);
                      }}
                      className="p-1.5 px-2 hover:bg-bg-light-gray rounded-md cursor-pointer flex items-center gap-2 transition-colors"
                    >
                      <img src={b.coverImage} alt={b.title} className="w-6 h-8.5 object-cover rounded-xs border border-border-light-gray shrink-0 shadow-xs" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-text-slate-dark truncate">{b.title}</p>
                        <p className="text-[10px] text-text-slate-medium truncate">{b.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Category: Buku Lain (Database) */}
              {matchingDbBooks.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-extrabold text-brand-orange uppercase px-2 py-1 mb-1">
                    Buku Baru (Database)
                  </div>
                  {matchingDbBooks.map(b => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setSelectedBookSuggestion(b as any);
                        setCurrentTab('books');
                        setLocalSearch('');
                        setShowSuggestions(false);
                      }}
                      className="p-1.5 px-2 hover:bg-bg-light-gray rounded-md cursor-pointer flex items-center gap-2 transition-colors"
                    >
                      <img src={b.coverImage} alt={b.title} className="w-6 h-8.5 object-cover rounded-xs border border-border-light-gray shrink-0 shadow-xs" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-text-slate-dark truncate">{b.title}</p>
                        <p className="text-[10px] text-text-slate-medium truncate">oleh {b.author}</p>
                      </div>
                      <span className="text-[9px] text-brand-orange border border-brand-orange/30 bg-brand-orange-glow px-1.5 py-0.5 rounded-md font-bold shrink-0 transition-all hover:bg-brand-orange hover:text-white">
                        + Tambah
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Category: Teman & Pengguna */}
              {matchingUsers.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-extrabold text-brand-orange uppercase px-2 py-1 mb-1">
                    Teman & Pengguna
                  </div>
                  {matchingUsers.map(u => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setViewedUser(u);
                        setCurrentTab('profile');
                        setLocalSearch('');
                        setShowSuggestions(false);
                      }}
                      className="p-1.5 px-2 hover:bg-bg-light-gray rounded-md cursor-pointer flex items-center gap-2 transition-colors"
                    >
                      <img src={u.avatar} alt={u.displayName} className="w-6 h-6 rounded-full object-cover border border-border-light-gray shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-text-slate-dark truncate">{u.displayName}</p>
                        <p className="text-[10px] text-text-slate-light truncate">@{u.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Category: Kutipan & Catatan */}
              {matchingPosts.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-extrabold text-brand-orange uppercase px-2 py-1 mb-1">
                    Kutipan & Catatan
                  </div>
                  {matchingPosts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setCurrentTab('feed');
                        setLocalSearch('');
                        setShowSuggestions(false);
                      }}
                      className="p-1.5 px-2 hover:bg-bg-light-gray rounded-md cursor-pointer flex flex-col gap-0.5 transition-colors"
                    >
                      <p className="text-text-slate-dark truncate italic font-medium">"{p.content}"</p>
                      {p.bookTitle && <p className="text-[9px] text-text-slate-medium truncate">Buku: {p.bookTitle}</p>}
                    </div>
                  ))}
                </div>
              )}

              {!hasSuggestions && (
                <div className="p-4 text-center text-text-slate-light text-[11px] font-medium leading-relaxed">
                  Tidak ada hasil lokal. Tekan <span className="font-bold text-text-slate-dark">Enter</span> untuk cari online di Open Library.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Notification Icons / Login / Profile Dropdown */}
        <div className="flex items-center gap-4 relative">
          {isLoggedIn ? (
            <>
              {/* Logged In Utilities */}
              <button className="bg-transparent border-none cursor-pointer text-text-slate-medium p-1.5 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <Bell size={20} className="text-brand-orange" />
              </button>
              
              <button className="bg-transparent border-none cursor-pointer text-text-slate-medium p-1.5 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <MessageSquare size={20} className="text-brand-orange" />
              </button>
              
              <button className="bg-transparent border-none cursor-pointer text-text-slate-medium p-1.5 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <Users size={20} className="text-brand-orange" />
              </button>

              {/* User Profile Avatar with Click Dropdown */}
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-8 h-8 rounded-full object-cover cursor-pointer border border-border-light-gray hover:border-brand-orange transition-all"
                />

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2.5 w-56 bg-white border border-border-light-gray rounded-lg shadow-md p-2 flex flex-col gap-1 z-50">
                    <div className="px-3 py-2 border-b border-border-light-gray mb-1">
                      <p className="text-xs font-bold text-text-slate-dark truncate">{currentUser.displayName}</p>
                      <p className="text-[10px] text-text-slate-light truncate">@{currentUser.username}</p>
                    </div>

                    <button
                      onClick={() => {
                        setViewedUser(null);
                        setCurrentTab('profile');
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold text-text-slate-medium rounded-md hover:bg-gray-100 hover:text-text-slate-dark transition-all cursor-pointer border-none bg-transparent"
                    >
                      <User size={14} className="text-text-slate-light" />
                      Profil Saya
                    </button>

                    <button
                      onClick={async () => {
                        setShowDropdown(false);
                        await logout();
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold text-red-600 rounded-md hover:bg-red-50 transition-all cursor-pointer border-none bg-transparent"
                    >
                      <LogOut size={14} className="text-red-500" />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Logged Out Guest Button */
            <button 
              onClick={loginWithGoogle}
              className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-4 rounded-full font-bold cursor-pointer"
            >
              Masuk dengan Google
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
