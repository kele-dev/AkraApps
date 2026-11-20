"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, MessageSquare, Users, Search, LogOut, User } from 'lucide-react';
import { LOCAL_BOOK_DATABASE } from '../features/Books/Books';
import { AnimatedBook } from './AnimatedBook';
import { searchBooksHybrid } from '../lib/bookApi';

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
    setSelectedBookSuggestion,
    notifications,
    unreadNotificationCount,
    markAllNotificationsRead,
    viewBookDetails,
    language,
    setLanguage,
    buddyReads,
    showToast
  } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  // Suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [onlineSuggestions, setOnlineSuggestions] = useState<any[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Click outside to close Suggestions & Profile Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced API search for live suggestions
  useEffect(() => {
    const trimmedQuery = localSearch.trim();
    if (trimmedQuery.length < 3) {
      setOnlineSuggestions([]);
      setIsSearchingOnline(false);
      return;
    }

    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const results = await searchBooksHybrid(trimmedQuery, 5, 'all', {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        
        // Filter out duplicates (already in books or LOCAL_BOOK_DATABASE)
        const filteredResults = results.filter((onlineBook: any) => {
          const inMyBooks = books.some(
            (mb) => mb.title.toLowerCase() === onlineBook.title.toLowerCase() && 
                    mb.author.toLowerCase() === onlineBook.author.toLowerCase()
          );
          const inDbBooks = LOCAL_BOOK_DATABASE.some(
            (dbb) => dbb.title.toLowerCase() === onlineBook.title.toLowerCase() && 
                     dbb.author.toLowerCase() === onlineBook.author.toLowerCase()
          );
          return !inMyBooks && !inDbBooks;
        });

        setOnlineSuggestions(filteredResults);
      } catch (err) {
        if ((err as { name?: string })?.name !== 'AbortError') {
          console.warn("Gagal mengambil saran pencarian online:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingOnline(false);
        }
      }
    }, 600); // 600ms debounce

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [localSearch, books]);

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

  const hasSuggestions = matchingMyBooks.length > 0 || matchingDbBooks.length > 0 || matchingUsers.length > 0 || matchingPosts.length > 0 || onlineSuggestions.length > 0;
  const showSuggestionsDropdown = showSuggestions && query.length > 0;

  const navLinks = [
    { id: 'feed', label: language === 'id' ? 'Beranda' : 'Home Feed' },
    { id: 'books', label: language === 'id' ? 'Perpustakaan' : 'Library' },
    { id: 'profile', label: language === 'id' ? 'Profil Saya' : 'My Profile' }
  ];

  return (
    <header className="bg-white border-b border-border-light-gray sticky top-0 z-50 h-14 flex justify-center items-center w-full">
      <div className="w-full max-w-[1140px] px-5 flex items-center justify-between h-full">
        
        {/* Left Section: Logo & Nav Links */}
        <div className="flex items-center gap-7">
          {/* Logo */}
          <button
            type="button"
            onClick={() => {
              setCurrentTab('feed');
              setViewedUser(null);
            }}
            aria-label="AKRA Beranda"
            className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
          >
            <AnimatedBook size="sm" className="transform hover:scale-105 active-pop" />
            <span className="text-xl font-extrabold text-brand-orange tracking-tight select-none">
              akra
            </span>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex gap-4">
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
            aria-label={language === 'id' ? "Cari buku, kutipan, atau teman" : "Search books, quotes, or friends"}
            className="input-field w-full pl-9 rounded-full h-8.5 text-xs bg-gray-100 border border-transparent py-1.5 focus-visible:ring-2 focus-visible:ring-brand-orange/35 focus:border-brand-orange focus:bg-white transition-all"
            placeholder={language === 'id' ? "Cari buku, kutipan, atau teman..." : "Search books, quotes, or friends..."}
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
                    {language === 'id' ? 'Buku Saya' : 'My Books'} ({matchingMyBooks.length})
                  </div>
                  {matchingMyBooks.map(b => (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => {
                        setCurrentTab('books');
                        setLocalSearch('');
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left bg-transparent border-none p-1.5 px-2 hover:bg-bg-light-gray rounded-md cursor-pointer flex items-center gap-2 transition-colors"
                    >
                      <img src={b.coverImage} alt={b.title} className="w-6 h-8.5 object-cover rounded-xs border border-border-light-gray shrink-0 shadow-xs" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-text-slate-dark truncate">{b.title}</p>
                        <p className="text-[10px] text-text-slate-medium truncate">{language === 'id' ? 'oleh' : 'by'} {b.author}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Category: Buku Lain (Database) */}
              {matchingDbBooks.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-extrabold text-brand-orange uppercase px-2 py-1 mb-1">
                    {language === 'id' ? 'Buku Baru (Database)' : 'New Books (Database)'}
                  </div>
                  {matchingDbBooks.map(b => (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => {
                        viewBookDetails(b as any);
                        setLocalSearch('');
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left bg-transparent border-none p-1.5 px-2 hover:bg-bg-light-gray rounded-md cursor-pointer flex items-center gap-2 transition-colors"
                    >
                      <img src={b.coverImage} alt={b.title} className="w-6 h-8.5 object-cover rounded-xs border border-border-light-gray shrink-0 shadow-xs" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-text-slate-dark truncate">{b.title}</p>
                        <p className="text-[10px] text-text-slate-medium truncate">{language === 'id' ? 'oleh' : 'by'} {b.author}</p>
                      </div>
                      <span className="text-[9px] text-brand-orange border border-brand-orange/30 bg-brand-orange-glow px-1.5 py-0.5 rounded-md font-bold shrink-0 transition-all hover:bg-brand-orange hover:text-white">
                        {language === 'id' ? '+ Tambah' : '+ Add'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Category: Teman & Pengguna */}
              {matchingUsers.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-extrabold text-brand-orange uppercase px-2 py-1 mb-1">
                    {language === 'id' ? 'Teman & Pengguna' : 'Friends & Users'}
                  </div>
                  {matchingUsers.map(u => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => {
                        setViewedUser(u);
                        setCurrentTab('profile');
                        setLocalSearch('');
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left bg-transparent border-none p-1.5 px-2 hover:bg-bg-light-gray rounded-md cursor-pointer flex items-center gap-2 transition-colors"
                    >
                      <img src={u.avatar} alt={u.displayName} className="w-6 h-6 rounded-full object-cover border border-border-light-gray shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-text-slate-dark truncate">{u.displayName}</p>
                        <p className="text-[10px] text-text-slate-light truncate">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Category: Kutipan & Catatan */}
              {matchingPosts.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-extrabold text-brand-orange uppercase px-2 py-1 mb-1">
                    {language === 'id' ? 'Kutipan & Catatan' : 'Quotes & Thoughts'}
                  </div>
                  {matchingPosts.map(p => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => {
                        setCurrentTab('feed');
                        setLocalSearch('');
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left bg-transparent border-none p-1.5 px-2 hover:bg-bg-light-gray rounded-md cursor-pointer flex flex-col gap-0.5 transition-colors"
                    >
                      <p className="text-text-slate-dark truncate italic font-medium">"{p.content}"</p>
                      {p.bookTitle && <p className="text-[9px] text-text-slate-medium truncate">{language === 'id' ? 'Buku' : 'Book'}: {p.bookTitle}</p>}
                    </button>
                  ))}
                </div>
              )}

              {/* Category: Hasil Online */}
              {isSearchingOnline ? (
                <div className="p-3 text-center text-text-slate-medium text-[10px] flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-brand-orange border-t-transparent rounded-full" />
                  {language === 'id' ? 'Mencari buku...' : 'Searching books...'}
                </div>
              ) : (
                onlineSuggestions.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-extrabold text-brand-orange uppercase px-2 py-1 mb-1">
                      {language === 'id' ? 'Buku Baru' : 'New Books'}
                    </div>
                    {onlineSuggestions.map(b => (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => {
                          viewBookDetails(b as any);
                          setLocalSearch('');
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left bg-transparent border-none p-1.5 px-2 hover:bg-bg-light-gray rounded-md cursor-pointer flex items-center gap-2 transition-colors"
                      >
                        <img src={b.coverImage} alt={b.title} className="w-6 h-8.5 object-cover rounded-xs border border-border-light-gray shrink-0 shadow-xs" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-text-slate-dark truncate">{b.title}</p>
                          <p className="text-[10px] text-text-slate-medium truncate">{language === 'id' ? 'oleh' : 'by'} {b.author}</p>
                        </div>
                        <span className="text-[9px] text-brand-orange border border-brand-orange/30 bg-brand-orange-glow px-1.5 py-0.5 rounded-md font-bold shrink-0 transition-all hover:bg-brand-orange hover:text-white">
                          {language === 'id' ? '+ Tambah' : '+ Add'}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              )}

              {!hasSuggestions && !isSearchingOnline && (
                <div className="p-2 flex flex-col gap-1.5">
                  <div className="p-2 text-center text-text-slate-light text-[11px] font-medium leading-relaxed">
                    {language === 'id' ? 'Tidak ada hasil lokal atau online yang ditemukan.' : 'No local or online results found.'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalSearchQuery(localSearch);
                      setCurrentTab('search');
                      setLocalSearch('');
                      setShowSuggestions(false);
                    }}
                    className="w-full py-2 px-3 bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange text-[11px] font-bold rounded-md border-none cursor-pointer text-center transition-all flex items-center justify-center gap-1.5"
                  >
                    <Search size={12} />
                    {language === 'id' ? 'Cari online' : 'Search online'} "{localSearch}"
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Notification Icons / Login / Profile Dropdown */}
        <div className="flex items-center gap-4 relative">
          {isLoggedIn ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button 
                  type="button"
                  aria-label={language === 'id' ? 'Notifikasi' : 'Notifications'}
                  aria-expanded={showNotifications}
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowDropdown(false);
                  }}
                  className="relative bg-transparent border-none cursor-pointer text-text-slate-medium p-1.5 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Bell size={20} className="text-brand-orange" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2.5 w-80 bg-white border border-border-light-gray rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
                    {/* Panel Header */}
                    <div className="flex justify-between items-center px-4 py-3 border-b border-border-light-gray bg-bg-light-gray">
                      <h4 className="text-xs font-extrabold text-text-slate-dark">Notifikasi</h4>
                      {unreadNotificationCount > 0 && (
                        <button
                          onClick={() => markAllNotificationsRead()}
                          className="text-[10px] font-bold text-brand-orange hover:text-brand-orange-hover bg-transparent border-none cursor-pointer"
                        >
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="flex flex-col max-h-80 overflow-y-auto divide-y divide-border-light-gray/50">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-text-slate-light py-8 font-medium">Tidak ada notifikasi baru.</p>
                      ) : (
                        notifications.slice(0, 8).map((notif) => {
                          const notifIcon = {
                            LIKE: '❤️',
                            COMMENT: '💬',
                            PROGRESS: '📖',
                            BUDDY_READ: '👥',
                            COMPLETED: '🎉'
                          }[notif.type];

                          const relativeTime = (() => {
                            const diff = Date.now() - new Date(notif.createdAt).getTime();
                            const mins = Math.floor(diff / 60000);
                            const hours = Math.floor(diff / 3600000);
                            const days = Math.floor(diff / 86400000);
                            if (mins < 60) return `${mins}m lalu`;
                            if (hours < 24) return `${hours}j lalu`;
                            return `${days}h lalu`;
                          })();

                          return (
                            <div
                              key={notif.id}
                              className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                                !notif.isRead ? 'bg-brand-orange/[0.04]' : ''
                              }`}
                            >
                              {/* Avatar */}
                              <div className="relative shrink-0">
                                <img
                                  src={notif.fromUserAvatar}
                                  alt={notif.fromUserDisplayName}
                                  className="w-8 h-8 rounded-full object-cover border border-border-light-gray"
                                />
                                <span className="absolute -bottom-0.5 -right-0.5 text-[11px] bg-white rounded-full shadow-xs border border-white">{notifIcon}</span>
                              </div>

                              {/* Text */}
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-text-slate-dark leading-snug">
                                  <span className="font-bold">{notif.fromUserDisplayName}</span>{' '}
                                  <span className="text-text-slate-medium">{notif.message}</span>
                                </p>
                                <p className="text-[10px] text-text-slate-light mt-0.5 font-semibold">{relativeTime}</p>
                              </div>

                              {/* Unread dot */}
                              {!notif.isRead && (
                                <div className="w-2 h-2 rounded-full bg-brand-orange shrink-0 mt-1" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* View All Footer */}
                    <div className="p-3 border-t border-border-light-gray bg-bg-light-gray text-center">
                      <button
                        onClick={() => {
                          markAllNotificationsRead();
                          setShowNotifications(false);
                        }}
                        className="text-[11px] font-bold text-brand-orange hover:text-brand-orange-hover bg-transparent border-none cursor-pointer"
                      >
                        Lihat semua aktivitas →
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => {
                  const myBuddy = buddyReads.find((br) => br.userIds.includes(currentUser.id));
                  const buddyBook = myBuddy ? books.find((b) => b.id === myBuddy.bookId) : null;
                  if (buddyBook) {
                    viewBookDetails(buddyBook);
                  } else {
                    setCurrentTab('books');
                    showToast(
                      language === 'id'
                        ? 'Pilih buku lalu undang teman untuk mulai chat Buddy Read.'
                        : 'Select a book and invite a friend to start Buddy Read chat.',
                      'info'
                    );
                  }
                }}
                aria-label={language === 'id' ? 'Pesan Buddy Read' : 'Buddy Read Messages'}
                className="hidden sm:flex bg-transparent border-none cursor-pointer text-text-slate-medium p-1.5 rounded-full items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <MessageSquare size={20} className="text-brand-orange" />
              </button>
              
              <button
                type="button"
                onClick={() => setCurrentTab('search')}
                aria-label={language === 'id' ? 'Temukan Teman & Grup' : 'Find Friends & Groups'}
                className="hidden sm:flex bg-transparent border-none cursor-pointer text-text-slate-medium p-1.5 rounded-full items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Users size={20} className="text-brand-orange" />
              </button>

              {/* User Profile Avatar with Click Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-label={language === 'id' ? 'Menu Profil' : 'Profile Menu'}
                  aria-expanded={showDropdown}
                  className="rounded-full p-0 border-none bg-transparent cursor-pointer flex items-center justify-center"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.displayName}
                    className="w-8 h-8 rounded-full object-cover border border-border-light-gray hover:border-brand-orange transition-all"
                  />
                </button>

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
                      {language === 'id' ? 'Profil Saya' : 'My Profile'}
                    </button>

                    <div className="px-3 py-2 border-t border-border-light-gray mt-1 flex items-center justify-between text-xs font-semibold">
                      <span className="text-text-slate-medium text-[11px]">{language === 'id' ? 'Bahasa' : 'Language'}</span>
                      <div className="inline-flex rounded-md overflow-hidden bg-bg-light-gray p-0.5 border border-border-light-gray">
                        <button
                          type="button"
                          onClick={() => setLanguage('id')}
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold cursor-pointer border-none ${
                            language === 'id' ? 'bg-white text-brand-orange shadow-xs font-black' : 'bg-transparent text-text-slate-medium'
                          }`}
                        >
                          ID
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage('en')}
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold cursor-pointer border-none ${
                            language === 'en' ? 'bg-white text-brand-orange shadow-xs font-black' : 'bg-transparent text-text-slate-medium'
                          }`}
                        >
                          EN
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        setShowDropdown(false);
                        await logout();
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold text-red-600 rounded-md hover:bg-red-50 transition-all cursor-pointer border-none bg-transparent border-t border-border-light-gray/40 pt-2"
                    >
                      <LogOut size={14} className="text-red-500" />
                      {language === 'id' ? 'Keluar' : 'Log Out'}
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
