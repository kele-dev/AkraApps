"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useApp, translations } from '../../context/AppContext';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { 
  BookOpen, CheckCircle, Flame, FileText, ArrowLeft, Trophy, Edit2, Check, 
  Award, Plus, FolderHeart, ChevronDown, ChevronRight, MoreVertical, Trash2,
  UserPlus, UserCheck, MessageCircle, MapPin, Calendar, Heart, MessageSquare,
  Quote, BookMarked, BarChart2
} from 'lucide-react';
import type { Book, Shelf, Post } from '../../types';
import { computePercent } from '../../lib/idAndMath';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80'
];

export const Profile: React.FC = () => {
  const { 
    currentUser, 
    viewedUser, 
    setViewedUser, 
    setCurrentTab, 
    posts, 
    books, 
    readingProgress, 
    goals, 
    setGoal, 
    updateProfile, 
    viewBookDetails, 
    savedPostIds,
    shelves,
    addShelf,
    assignBookToShelves,
    updateProgress,
    likePost,
    followUser,
    isFollowing,
    users,
    deletePost,
    language
  } = useApp();

  const targetUser = viewedUser || currentUser;
  const isOwnProfile = targetUser.id === currentUser.id;
  const following = isFollowing(targetUser.id);

  // Profile edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editLocation, setEditLocation] = useState('');

  // Main tab: 'bookshelf' | 'updates' | 'quotes'
  const [mainTab, setMainTab] = useState<'bookshelf' | 'updates' | 'quotes'>('bookshelf');
  
  // Bookshelf sub-tab
  const [bookshelfSubTab, setBookshelfSubTab] = useState<'reading' | 'want_to_read' | 'read' | 'shelves' | 'stats'>('reading');

  // Reading Goal
  const currentYear = new Date().getFullYear();
  const userGoal = goals.find((g) => g.userId === targetUser.id && g.year === currentYear) || {
    targetBooks: 12,
    completedBooksCount: 0
  };
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoalTarget, setNewGoalTarget] = useState(12);

  // Quick progress modal states
  const [activeProgressBook, setActiveProgressBook] = useState<Book | null>(null);
  const [quickProgressPage, setQuickProgressPage] = useState<number>(0);
  const [quickSelectedShelves, setQuickSelectedShelves] = useState<string[]>([]);
  const [quickProgressRating, setQuickProgressRating] = useState<number>(0);
  const [quickProgressNote, setQuickProgressNote] = useState<string>('');
  const [actionMenuBookId, setActionMenuBookId] = useState<string | null>(null);
  const [newShelfName, setNewShelfName] = useState('');
  const [expandedShelfId, setExpandedShelfId] = useState<string | null>(null);
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);

  // Sync goal target
  useEffect(() => {
    setNewGoalTarget(userGoal.targetBooks);
  }, [userGoal.targetBooks, targetUser.id]);

  // Reset to bookshelf tab when switching profiles
  useEffect(() => {
    setMainTab('bookshelf');
    setBookshelfSubTab('reading');
  }, [targetUser.id]);

  const openEditModal = () => {
    setEditName(currentUser.displayName);
    setEditUsername(currentUser.username);
    setEditBio(currentUser.bio || '');
    setEditWebsite(currentUser.website || '');
    setEditGender(currentUser.gender || 'Pilih tidak menyebutkan');
    setEditAvatar(currentUser.avatar);
    setEditLocation(currentUser.location || '');
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName: editName,
      username: editUsername,
      bio: editBio,
      website: editWebsite,
      gender: editGender,
      avatar: editAvatar,
      location: editLocation,
    });
    setIsEditing(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Ukuran gambar terlalu besar. Maksimal 2MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () => { if (typeof reader.result === 'string') setEditAvatar(reader.result); };
    reader.readAsDataURL(file);
  };

  // Filtered data
  const userProgress = readingProgress.filter((p) => p.userId === targetUser.id);
  const readingBooks = books.filter((b) => userProgress.some((p) => p.bookId === b.id && p.status === 'READING'));
  const completedBooks = books.filter((b) => userProgress.some((p) => p.bookId === b.id && p.status === 'COMPLETED'));
  const wantToReadBooks = books.filter((b) => userProgress.some((p) => p.bookId === b.id && p.status === 'WANT_TO_READ'));
  const userPosts = posts.filter(p => p.userId === targetUser.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const userQuotes = userPosts.filter(p => p.type === 'QUOTE');

  // Stats
  const completionPercentage = computePercent(completedBooks.length, userGoal.targetBooks);
  const remainingBooks = Math.max(0, userGoal.targetBooks - completedBooks.length);

  // Social counts
  const followingCount = (targetUser.followingIds || []).length;
  const followerCount = (targetUser.followerIds || []).length;
  const totalBooks = readingBooks.length + completedBooks.length + wantToReadBooks.length;

  // Friend calculation (mutual follow)
  const friendsCount = (targetUser.followingIds || []).filter(id => (targetUser.followerIds || []).includes(id)).length;

  // Goal handlers
  const handleSaveGoal = () => {
    if (newGoalTarget > 0) { setGoal(newGoalTarget); setIsEditingGoal(false); }
  };

  // Progress modal
  const handleOpenProgressModal = (book: Book) => {
    const progress = userProgress.find((p) => p.bookId === book.id);
    setQuickProgressPage(progress ? progress.currentPage : 0);
    setQuickProgressRating(progress && progress.rating ? progress.rating : 0);
    setQuickProgressNote('');
    const containingShelves = shelves.filter((s) => s.userId === targetUser.id && s.bookIds.includes(book.id)).map((s) => s.id);
    setQuickSelectedShelves(containingShelves);
    setActiveProgressBook(book);
  };

  const handleSaveQuickProgress = () => {
    if (!activeProgressBook) return;
    const status = quickProgressPage >= activeProgressBook.totalPages ? 'COMPLETED' : 'READING';
    updateProgress(activeProgressBook.id, quickProgressPage, status, quickProgressRating > 0 ? quickProgressRating : undefined, quickProgressNote);
    if (isOwnProfile) assignBookToShelves(activeProgressBook.id, quickSelectedShelves);
    setActiveProgressBook(null);
  };

  const handleToggleShelfInModal = (shelfId: string) => {
    setQuickSelectedShelves((prev) => prev.includes(shelfId) ? prev.filter((id) => id !== shelfId) : [...prev, shelfId]);
  };

  const handleCreateShelf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelfName.trim()) return;
    addShelf(newShelfName.trim());
    setNewShelfName('');
  };

  const handleMoveBookStatus = (bookId: string, status: 'WANT_TO_READ' | 'READING' | 'COMPLETED') => {
    const progress = userProgress.find(p => p.bookId === bookId);
    const currentPage = status === 'COMPLETED' ? (books.find(b => b.id === bookId)?.totalPages || 0) : (progress ? progress.currentPage : 0);
    updateProgress(bookId, currentPage, status);
    setActionMenuBookId(null);
  };

  // Relative time helper
  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  // Join date format
  const joinDate = targetUser.joinedAt 
    ? new Date(targetUser.joinedAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="flex flex-col gap-0 max-w-[750px] mx-auto animate-fade-in pb-20">
      
      {/* Back Button */}
      {!isOwnProfile && (
        <button
          onClick={() => { setViewedUser(null); setCurrentTab('feed'); }}
          className="flex items-center gap-2 self-start text-xs font-extrabold text-text-slate-dark hover:text-brand-orange cursor-pointer transition-colors border border-border-light-gray bg-white py-2 px-4 rounded-full shadow-xs hover:shadow-sm mb-4"
        >
          <ArrowLeft size={14} className="text-brand-orange" />
          Kembali ke Home Feed
        </button>
      )}

      {/* ============ PROFILE HEADER (Goodreads style) ============ */}
      <div className="bg-white border border-border-light-gray rounded-2xl overflow-hidden shadow-xs mb-0">
        
        {/* Cover banner */}
        <div className="h-24 sm:h-32 bg-gradient-to-br from-brand-orange/20 via-amber-100 to-orange-50 relative">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, #f97316 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fb923c 0%, transparent 40%)'
          }} />
          {/* Edit Profil button — top right */}
          {isOwnProfile && (
            <button
              onClick={openEditModal}
              className="absolute top-3 right-3 flex items-center gap-1.5 py-1.5 px-3 text-[11px] font-bold rounded-lg bg-white/80 backdrop-blur-xs border border-white/60 text-text-slate-dark hover:bg-white shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <Edit2 size={12} />
              Edit Profil
            </button>
          )}
        </div>

        {/* Avatar + Stats row */}
        <div className="px-5 pb-4">
          <div className="flex items-end justify-between -mt-10 mb-3">
            {/* Avatar */}
            <div className="relative">
              <img
                src={targetUser.avatar}
                alt={targetUser.displayName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-md"
              />
              {isOwnProfile && (
                <button
                  onClick={openEditModal}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-brand-orange rounded-full flex items-center justify-center border-2 border-white shadow-sm cursor-pointer hover:bg-brand-orange-hover transition-colors"
                >
                  <Edit2 size={12} className="text-white" />
                </button>
              )}
            </div>

            {/* Stats row (Books · Friends · Following) */}
            <div className="flex gap-5 sm:gap-8 pt-2">
              <div className="flex flex-col items-center">
                <span className="text-base sm:text-xl font-extrabold text-text-slate-dark leading-none">{totalBooks}</span>
                <span className="text-[10px] text-text-slate-light font-semibold mt-0.5">Buku</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base sm:text-xl font-extrabold text-text-slate-dark leading-none">{friendsCount}</span>
                <span className="text-[10px] text-text-slate-light font-semibold mt-0.5">Teman</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base sm:text-xl font-extrabold text-text-slate-dark leading-none">{followingCount}</span>
                <span className="text-[10px] text-text-slate-light font-semibold mt-0.5">Following</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base sm:text-xl font-extrabold text-text-slate-dark leading-none">{followerCount}</span>
                <span className="text-[10px] text-text-slate-light font-semibold mt-0.5">Followers</span>
              </div>
            </div>
          </div>

          {/* Name, username, location, joined */}
          <div className="mb-3">
            <h2 className="text-lg font-extrabold text-text-slate-dark tracking-tight leading-snug">
              {targetUser.displayName}
            </h2>
            <p className="text-xs text-text-slate-medium font-medium">@{targetUser.username}</p>
            {targetUser.bio && (
              <p className="text-xs text-text-slate-medium leading-relaxed mt-1.5 max-w-md">{targetUser.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {targetUser.location && (
                <span className="flex items-center gap-1 text-[11px] text-text-slate-light font-semibold">
                  <MapPin size={11} className="text-brand-orange shrink-0" />
                  {targetUser.location}
                </span>
              )}
              {joinDate && (
                <span className="flex items-center gap-1 text-[11px] text-text-slate-light font-semibold">
                  <Calendar size={11} className="text-brand-orange shrink-0" />
                  Bergabung {joinDate}
                </span>
              )}
              {targetUser.website && (
                <a
                  href={targetUser.website.startsWith('http') ? targetUser.website : `https://${targetUser.website}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-bold text-brand-orange hover:underline"
                >
                  🔗 {targetUser.website}
                </a>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => followUser(targetUser.id)}
                className={`flex items-center gap-2 py-2 px-5 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                  following 
                    ? 'bg-brand-orange text-white border-brand-orange hover:bg-brand-orange-hover' 
                    : 'bg-white text-brand-orange border-brand-orange hover:bg-brand-orange hover:text-white'
                }`}
              >
                {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                {following ? 'Following' : 'Follow'}
              </button>
              
              {/* Friend button (mutual follow) */}
              {following && (targetUser.followingIds || []).includes(currentUser.id) && (
                <button className="flex items-center gap-2 py-2 px-5 text-xs font-bold rounded-lg bg-amber-50 text-amber-600 border border-amber-200 cursor-default">
                  <UserCheck size={14} />
                  Teman
                </button>
              )}

              <button className="flex items-center gap-2 py-2 px-5 text-xs font-bold rounded-lg bg-white text-text-slate-dark border border-border-light-gray hover:bg-gray-50 transition-all cursor-pointer">
                <MessageCircle size={14} />
                Pesan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============ YEARLY CHALLENGE (compact) ============ */}
      <div className="bg-white border border-t-0 border-border-light-gray px-5 py-3 flex items-center gap-4">
        <Trophy size={16} className="text-brand-orange shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold text-text-slate-dark">
              {currentYear} Reading Challenge: {completedBooks.length}/{userGoal.targetBooks} buku
            </span>
            {isOwnProfile && (
              isEditingGoal ? (
                <div className="flex items-center gap-2">
                  <input type="range" min="1" max="100" value={newGoalTarget} 
                    onChange={e => setNewGoalTarget(parseInt(e.target.value) || 12)}
                    className="w-20 accent-brand-orange h-1" />
                  <span className="text-[10px] font-bold text-brand-orange">{newGoalTarget}</span>
                  <button onClick={handleSaveGoal} className="text-[10px] font-bold text-brand-orange bg-transparent border-none cursor-pointer">✓</button>
                </div>
              ) : (
                <button onClick={() => { setNewGoalTarget(userGoal.targetBooks); setIsEditingGoal(true); }}
                  className="text-[10px] text-text-slate-light font-semibold bg-transparent border-none cursor-pointer hover:text-brand-orange">
                  Atur Target
                </button>
              )
            )}
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-orange transition-all duration-500 rounded-full" style={{ width: `${completionPercentage}%` }} />
          </div>
        </div>
        <span className="text-xs font-extrabold text-brand-orange shrink-0">{completionPercentage}%</span>
      </div>

      {/* ============ MAIN TABS (Bookshelf / Updates / Quotes) ============ */}
      <div className="bg-white border border-t-0 border-border-light-gray rounded-b-2xl shadow-xs">
        {/* Tab header */}
        <div className="flex border-b border-border-light-gray">
          {[
            { id: 'bookshelf', label: 'Bookshelf', icon: <BookMarked size={14} /> },
            { id: 'updates', label: 'Updates', icon: <BarChart2 size={14} /> },
            { id: 'quotes', label: 'Quotes', icon: <Quote size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0 ${
                mainTab === tab.id 
                  ? 'text-brand-orange border-brand-orange' 
                  : 'text-text-slate-light border-transparent hover:text-text-slate-medium'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ========== TAB: BOOKSHELF ========== */}
        {mainTab === 'bookshelf' && (
          <div className="p-5 flex flex-col gap-6">
            
            {/* Currently Reading horizontal scroll */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-extrabold text-text-slate-dark uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={14} className="text-brand-orange" />
                  Currently Reading
                  <span className="text-text-slate-light font-bold">({readingBooks.length})</span>
                </h3>
                <button onClick={() => setBookshelfSubTab('reading')} className="text-[10px] text-brand-orange font-bold bg-transparent border-none cursor-pointer hover:underline">
                  Lihat semua
                </button>
              </div>

              {readingBooks.length === 0 ? (
                <p className="text-xs text-text-slate-light italic py-3">Belum ada buku yang sedang dibaca.</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {readingBooks.map((book) => {
                    const progress = userProgress.find((p) => p.bookId === book.id);
                    const percent = computePercent(progress?.currentPage || 0, book.totalPages);
                    return (
                      <div key={book.id} className="flex flex-col gap-2 min-w-[90px] max-w-[90px] shrink-0 group cursor-pointer"
                        onClick={() => viewBookDetails(book)}>
                        <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-border-light-gray shadow-2xs group-hover:shadow-xs transition-all">
                          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                            <div className="h-full bg-brand-orange" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-text-slate-dark truncate group-hover:text-brand-orange transition-colors leading-tight">{book.title}</p>
                        <p className="text-[9px] text-text-slate-light -mt-1">{percent}%</p>
                        {isOwnProfile && (
                          <button onClick={e => { e.stopPropagation(); handleOpenProgressModal(book); }}
                            className="text-[9px] font-bold text-brand-orange border border-brand-orange/30 bg-brand-orange-glow rounded-full px-2 py-0.5 hover:bg-brand-orange hover:text-white transition-all cursor-pointer text-center">
                            + Progres
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Want to Read */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-extrabold text-text-slate-dark uppercase tracking-wider">
                  Want to Read <span className="text-text-slate-light font-bold">({wantToReadBooks.length})</span>
                </h3>
              </div>
              {wantToReadBooks.length === 0 ? (
                <p className="text-xs text-text-slate-light italic">Belum ada buku di daftar ini.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {wantToReadBooks.slice(0, 6).map((book) => (
                    <div key={book.id} className="flex flex-col group relative">
                      <div className="relative aspect-[2/3] rounded-md overflow-hidden border border-border-light-gray shadow-2xs group-hover:shadow-xs transition-all">
                        <img src={book.coverImage} alt={book.title} onClick={() => viewBookDetails(book)}
                          className="w-full h-full object-cover cursor-pointer group-hover:scale-102 transition-transform duration-200" />
                        {isOwnProfile && (
                          <div className="absolute top-1 right-1">
                            <button onClick={() => setActionMenuBookId(actionMenuBookId === book.id ? null : book.id)}
                              className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center text-text-slate-medium shadow-xs cursor-pointer">
                              <MoreVertical size={10} />
                            </button>
                            {actionMenuBookId === book.id && (
                              <div className="absolute right-0 mt-0.5 w-32 bg-white border border-border-light-gray rounded-lg shadow-md p-1 z-30 animate-fade-in">
                                <button onClick={() => handleMoveBookStatus(book.id, 'READING')}
                                  className="text-left w-full bg-transparent border-none text-[10px] font-semibold text-text-slate-medium rounded-md py-1.5 px-2 hover:bg-gray-100 cursor-pointer">📖 Mulai Baca</button>
                                <button onClick={() => handleMoveBookStatus(book.id, 'COMPLETED')}
                                  className="text-left w-full bg-transparent border-none text-[10px] font-semibold text-text-slate-medium rounded-md py-1.5 px-2 hover:bg-gray-100 cursor-pointer">✓ Selesai</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-text-slate-dark mt-1 truncate cursor-pointer hover:text-brand-orange" onClick={() => viewBookDetails(book)}>{book.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Read */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-extrabold text-text-slate-dark uppercase tracking-wider">
                  Read <span className="text-text-slate-light font-bold">({completedBooks.length})</span>
                </h3>
              </div>
              {completedBooks.length === 0 ? (
                <p className="text-xs text-text-slate-light italic">Belum ada buku yang diselesaikan.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {completedBooks.slice(0, 6).map((book) => (
                    <div key={book.id} className="flex flex-col group relative">
                      <div className="relative aspect-[2/3] rounded-md overflow-hidden border border-border-light-gray shadow-2xs group-hover:shadow-xs transition-all">
                        <img src={book.coverImage} alt={book.title} onClick={() => viewBookDetails(book)}
                          className="w-full h-full object-cover cursor-pointer group-hover:scale-102 transition-transform duration-200" />
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-orange" />
                        {isOwnProfile && (
                          <div className="absolute top-1 right-1">
                            <button onClick={() => setActionMenuBookId(actionMenuBookId === book.id ? null : book.id)}
                              className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center text-text-slate-medium shadow-xs cursor-pointer">
                              <MoreVertical size={10} />
                            </button>
                            {actionMenuBookId === book.id && (
                              <div className="absolute right-0 mt-0.5 w-32 bg-white border border-border-light-gray rounded-lg shadow-md p-1 z-30 animate-fade-in">
                                <button onClick={() => handleMoveBookStatus(book.id, 'READING')}
                                  className="text-left w-full bg-transparent border-none text-[10px] font-semibold text-text-slate-medium rounded-md py-1.5 px-2 hover:bg-gray-100 cursor-pointer">📖 Baca Ulang</button>
                                <button onClick={() => handleMoveBookStatus(book.id, 'WANT_TO_READ')}
                                  className="text-left w-full bg-transparent border-none text-[10px] font-semibold text-text-slate-medium rounded-md py-1.5 px-2 hover:bg-gray-100 cursor-pointer">⏳ Ingin Baca</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-text-slate-dark mt-1 truncate cursor-pointer hover:text-brand-orange" onClick={() => viewBookDetails(book)}>{book.title}</p>
                      <span className="text-[9px] text-brand-orange font-bold">✓ Selesai</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rak Buku */}
            {(() => {
              const userShelves = shelves.filter(s => s.userId === targetUser.id);
              return userShelves.length > 0 ? (
                <div>
                  <h3 className="text-xs font-extrabold text-text-slate-dark uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FolderHeart size={14} className="text-brand-orange" />
                    Rak Buku ({userShelves.length})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {userShelves.map(shelf => {
                      const shelfBooks = books.filter(b => shelf.bookIds.includes(b.id));
                      const isExpanded = expandedShelfId === shelf.id;
                      return (
                        <div key={shelf.id} className="border border-border-light-gray rounded-xl overflow-hidden">
                          <div onClick={() => setExpandedShelfId(isExpanded ? null : shelf.id)}
                            className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown size={14} className="text-brand-orange" /> : <ChevronRight size={14} className="text-brand-orange" />}
                              <span className="text-xs font-bold text-text-slate-dark">{shelf.name}</span>
                              <span className="text-[10px] text-text-slate-light font-semibold">({shelfBooks.length})</span>
                            </div>
                            <div className="flex -space-x-2">
                              {shelfBooks.slice(0, 3).map(b => (
                                <img key={b.id} src={b.coverImage} alt="" className="w-5 h-7 object-cover rounded-xs border border-white shadow-xs" />
                              ))}
                            </div>
                          </div>
                          {isExpanded && shelfBooks.length > 0 && (
                            <div className="p-3 pt-0 border-t border-border-light-gray/60 grid grid-cols-5 sm:grid-cols-6 gap-2 animate-slide-in">
                              {shelfBooks.map(book => (
                                <img key={book.id} src={book.coverImage} alt={book.title} onClick={() => viewBookDetails(book)}
                                  className="w-full aspect-[2/3] object-cover rounded-md border border-border-light-gray cursor-pointer hover:scale-102 transition-transform" />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {isOwnProfile && (
                    <form onSubmit={handleCreateShelf} className="flex gap-2 mt-3">
                      <input type="text" value={newShelfName} onChange={e => setNewShelfName(e.target.value)}
                        className="input-field flex-1 py-1.5 px-3 text-xs rounded-lg h-8"
                        placeholder="Buat rak baru..." />
                      <button type="submit" className="btn-primary py-1.5 px-3 text-xs rounded-lg h-8 shrink-0">
                        <Plus size={12} />
                      </button>
                    </form>
                  )}
                </div>
              ) : isOwnProfile ? (
                <div>
                  <h3 className="text-xs font-extrabold text-text-slate-dark uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FolderHeart size={14} className="text-brand-orange" /> Rak Buku
                  </h3>
                  <form onSubmit={handleCreateShelf} className="flex gap-2">
                    <input type="text" value={newShelfName} onChange={e => setNewShelfName(e.target.value)}
                      className="input-field flex-1 py-1.5 px-3 text-xs rounded-lg h-8"
                      placeholder="Buat rak kustom pertama Anda..." />
                    <button type="submit" className="btn-primary py-1.5 px-3 text-xs rounded-lg h-8 shrink-0">
                      <Plus size={12} />
                    </button>
                  </form>
                </div>
              ) : null;
            })()}

            {/* Mini reading stats */}
            {(() => {
              const ratedProgress = userProgress.filter(p => p.rating && p.rating > 0);
              const avgRating = ratedProgress.length > 0 
                ? (ratedProgress.reduce((sum, p) => sum + (p.rating || 0), 0) / ratedProgress.length).toFixed(1) 
                : null;
              const totalPages = userProgress.reduce((s, p) => s + p.currentPage, 0);

              const genreCounts: Record<string, number> = {};
              books.filter(b => userProgress.some(p => p.bookId === b.id)).forEach(b => {
                const cat = b.category || 'Lainnya';
                genreCounts[cat] = (genreCounts[cat] || 0) + 1;
              });
              const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
              const maxCount = sortedGenres[0]?.[1] || 1;
              const genreColors = ['bg-brand-orange', 'bg-amber-400', 'bg-yellow-500', 'bg-orange-300', 'bg-red-400'];

              return (
                <div>
                  <h3 className="text-xs font-extrabold text-text-slate-dark uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <BarChart2 size={14} className="text-brand-orange" /> {translations[language].readingStats}
                  </h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {avgRating && (
                      <div className="bg-brand-orange-glow border border-brand-orange/10 rounded-xl p-3 text-center">
                        <p className="text-xl font-black text-brand-orange leading-none">⭐ {avgRating}</p>
                        <p className="text-[10px] text-text-slate-medium font-semibold mt-1">{translations[language].avgRating}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 border border-border-light-gray rounded-xl p-3 text-center">
                      <p className="text-xl font-black text-slate-700 leading-none">{totalPages.toLocaleString('id-ID')}</p>
                      <p className="text-[10px] text-text-slate-medium font-semibold mt-1">{translations[language].pagesReadCount}</p>
                    </div>
                    <div className="bg-gray-50 border border-border-light-gray rounded-xl p-3 text-center">
                      <p className="text-xl font-black text-[#348055] leading-none">{completedBooks.length}</p>
                      <p className="text-[10px] text-text-slate-medium font-semibold mt-1">{translations[language].completed}</p>
                    </div>
                  </div>

                  {sortedGenres.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {sortedGenres.slice(0, 4).map(([genre, count], idx) => (
                        <div key={genre} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-text-slate-dark min-w-[80px] truncate">{genre}</span>
                          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${genreColors[idx] || 'bg-brand-orange'} rounded-full transition-all duration-700`}
                              style={{ width: `${Math.round((count / maxCount) * 100)}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-text-slate-medium w-8 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ========== TAB: UPDATES ========== */}
        {mainTab === 'updates' && (
          <div className="p-4 flex flex-col gap-4">
            {userPosts.length === 0 ? (
              <div className="text-center py-16 text-text-slate-light">
                <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">{translations[language].noActivity}</p>
                <p className="text-xs mt-1">{translations[language].startActivityDesc}</p>
              </div>
            ) : (
              userPosts.map(post => {
                const isLiked = post.likes.includes(currentUser.id);
                const typeLabel = {
                  QUOTE: { icon: '💬', label: language === 'id' ? 'Kutipan' : 'Quote' },
                  THOUGHT: { icon: '💭', label: language === 'id' ? 'Pemikiran' : 'Thought' },
                  PROGRESS_UPDATE: { icon: '📖', label: language === 'id' ? 'Update Baca' : 'Reading Update' },
                  PHOTO: { icon: '📷', label: language === 'id' ? 'Foto' : 'Photo' }
                }[post.type];

                return (
                  <div key={post.id} className="border border-border-light-gray rounded-xl p-4 bg-white hover:border-slate-200 hover:shadow-xs transition-all">
                    {/* Post Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">{typeLabel.icon}</span>
                      <span className="text-[10px] font-bold text-text-slate-light uppercase tracking-wide">{typeLabel.label}</span>
                      {post.bookTitle && (
                        <>
                          <span className="text-[10px] text-text-slate-light">·</span>
                          <span className="text-[10px] font-bold text-brand-orange truncate max-w-[150px]">{post.bookTitle}</span>
                        </>
                      )}
                      <span className="ml-auto text-[10px] text-text-slate-light shrink-0">{relativeTime(post.createdAt)}</span>
                    </div>

                    {/* Post Content */}
                    {post.type === 'QUOTE' ? (
                      <blockquote className="border-l-2 border-brand-orange pl-3 italic text-sm text-text-slate-dark leading-relaxed">
                        {post.content}
                      </blockquote>
                    ) : (
                      <p className="text-sm text-text-slate-dark leading-relaxed">{post.content}</p>
                    )}

                    {/* Progress bar for PROGRESS_UPDATE */}
                    {post.type === 'PROGRESS_UPDATE' && post.currentPage && post.totalPages && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-orange rounded-full" 
                            style={{ width: `${Math.round((post.currentPage / post.totalPages) * 100)}%` }} />
                        </div>
                        <span className="text-[10px] text-text-slate-medium font-bold shrink-0">
                          {post.currentPage}/{post.totalPages} hal
                        </span>
                      </div>
                    )}

                    {/* Rating */}
                    {post.rating && post.rating > 0 && (
                      <div className="flex gap-0.5 mt-2">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`text-sm ${s <= post.rating! ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-light-gray/60">
                      <button
                        onClick={() => likePost(post.id)}
                        className={`flex items-center gap-1.5 text-[11px] font-bold bg-transparent border-none cursor-pointer transition-colors ${isLiked ? 'text-red-500' : 'text-text-slate-light hover:text-red-400'}`}
                      >
                        <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                        {post.likes.length > 0 && <span>{post.likes.length}</span>}
                        <span>{translations[language].like}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-[11px] font-bold text-text-slate-light hover:text-text-slate-medium bg-transparent border-none cursor-pointer transition-colors">
                        <MessageSquare size={14} />
                        {post.comments.length > 0 && <span>{post.comments.length}</span>}
                        <span>{translations[language].comment}</span>
                      </button>
                      {post.userId === currentUser.id && (
                        <button
                          onClick={() => setDeleteConfirmPostId(post.id)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-text-slate-light hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors ml-auto"
                        >
                          <Trash2 size={14} />
                          <span>{translations[language].delete}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========== TAB: QUOTES ========== */}
        {mainTab === 'quotes' && (
          <div className="p-4 flex flex-col gap-4">
            {userQuotes.length === 0 ? (
              <div className="text-center py-16 text-text-slate-light">
                <Quote size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">{translations[language].noQuotes}</p>
                <p className="text-xs mt-1">{translations[language].shareQuoteDesc}</p>
              </div>
            ) : (
              userQuotes.map(post => {
                const isLiked = post.likes.includes(currentUser.id);
                return (
                  <div key={post.id} 
                    className="relative rounded-2xl overflow-hidden border border-amber-100/80 bg-gradient-to-br from-amber-50/60 to-orange-50/30 p-5 hover:shadow-sm transition-all">
                    {/* Large quote mark */}
                    <div className="absolute top-3 left-4 text-5xl text-brand-orange/10 font-serif leading-none select-none pointer-events-none">"</div>
                    
                    <blockquote className="text-sm text-text-slate-dark leading-relaxed italic font-medium relative z-10 pl-2 pr-2">
                      {post.content}
                    </blockquote>

                    {post.bookTitle && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-brand-orange/40 rounded-full" />
                        <span className="text-[11px] font-bold text-brand-orange">{post.bookTitle}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-amber-100">
                      <span className="text-[10px] text-text-slate-light font-semibold">{relativeTime(post.createdAt)}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => likePost(post.id)}
                          className={`flex items-center gap-1 text-[11px] font-bold bg-transparent border-none cursor-pointer transition-colors ${isLiked ? 'text-red-500' : 'text-text-slate-light hover:text-red-400'}`}
                        >
                          <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
                          {post.likes.length > 0 && <span>{post.likes.length}</span>}
                        </button>
                        {post.userId === currentUser.id && (
                          <button
                            onClick={() => setDeleteConfirmPostId(post.id)}
                            className="flex items-center text-text-slate-light hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors"
                            title="Hapus Kutipan"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ============ DELETE CONFIRMATION MODAL ============ */}
      {deleteConfirmPostId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <Card className="max-w-xs w-full p-6 flex flex-col gap-4 animate-slide-in">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3 text-lg">
                ⚠️
              </div>
              <h4 className="text-sm font-bold text-text-slate-dark mb-1">Hapus Aktivitas?</h4>
              <p className="text-xs text-text-slate-medium leading-relaxed">
                Apakah Anda yakin ingin menghapus aktivitas membaca ini? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPostId(null)}
                className="btn-secondary flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePost(deleteConfirmPostId);
                  setDeleteConfirmPostId(null);
                }}
                className="bg-red-500 hover:bg-red-600 text-white flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer shadow-sm transition-colors"
              >
                Hapus
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ============ EDIT PROFILE MODAL ============ */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-light-gray bg-bg-light-gray">
              <h3 className="text-sm font-bold text-text-slate-dark">Edit Profil</h3>
              <button type="button" onClick={() => setIsEditing(false)}
                className="text-text-slate-medium hover:text-text-slate-dark bg-transparent border-none text-xl cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[85vh]">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2 pb-4 border-b border-border-light-gray">
                <div className="relative group cursor-pointer w-16 h-16" onClick={() => fileInputRef.current?.click()}>
                  <img src={editAvatar} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-brand-orange shadow-md group-hover:opacity-85 transition-opacity" />
                  <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-[9px] font-bold">Ubah</span>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="bg-transparent border-none text-xs font-bold text-brand-orange cursor-pointer hover:text-brand-orange-hover">
                  Unggah Gambar Baru
                </button>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-text-slate-medium font-semibold">Preset:</span>
                  <div className="flex gap-1.5">
                    {PRESET_AVATARS.map((av, idx) => (
                      <img key={idx} src={av} alt="" onClick={() => setEditAvatar(av)}
                        className={`w-6 h-6 rounded-full object-cover cursor-pointer border transition-all ${editAvatar === av ? 'border-brand-orange ring-2 ring-brand-orange/20 scale-105' : 'border-border-light-gray'}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Nama', value: editName, setter: setEditName, required: true },
                  { label: 'Username', value: editUsername, setter: setEditUsername, required: true },
                  { label: 'Lokasi', value: editLocation, setter: setEditLocation },
                  { label: 'Website', value: editWebsite, setter: setEditWebsite, placeholder: 'https://situs-web.com' },
                ].map(field => (
                  <div key={field.label} className="grid grid-cols-1 sm:grid-cols-[90px_1fr] items-center gap-2">
                    <label className="text-xs font-semibold text-text-slate-medium sm:text-right sm:pr-3">{field.label}</label>
                    <input type="text" value={field.value} required={field.required}
                      onChange={e => field.setter(e.target.value)}
                      placeholder={field.placeholder}
                      className="input-field w-full px-3 py-2 rounded-md text-xs focus:outline-none" />
                  </div>
                ))}

                <div className="grid grid-cols-1 sm:grid-cols-[90px_1fr] items-start gap-2">
                  <label className="text-xs font-semibold text-text-slate-medium sm:text-right sm:pr-3 pt-2">Bio</label>
                  <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3}
                    className="input-field w-full px-3 py-2 rounded-md text-xs focus:outline-none resize-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[90px_1fr] items-center gap-2">
                  <label className="text-xs font-semibold text-text-slate-medium sm:text-right sm:pr-3">Gender</label>
                  <select value={editGender} onChange={e => setEditGender(e.target.value)}
                    className="input-field w-full px-3 py-2 rounded-md text-xs focus:outline-none">
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                    <option value="Pilih tidak menyebutkan">Pilih tidak menyebutkan</option>
                    <option value="Kustom">Kustom</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border-light-gray mt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary py-1.5 px-4 text-xs font-bold">Batal</button>
                <button type="submit" className="btn-primary py-1.5 px-4 text-xs font-bold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ QUICK PROGRESS MODAL ============ */}
      {activeProgressBook && (() => {
        const userShelves = shelves.filter(s => s.userId === currentUser.id);
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-in">
              <div className="flex justify-between items-center px-5 py-4 border-b border-border-light-gray bg-bg-light-gray">
                <h3 className="text-xs font-extrabold text-text-slate-dark truncate max-w-[250px]">
                  Perbarui Progres: {activeProgressBook.title}
                </h3>
                <button onClick={() => setActiveProgressBook(null)}
                  className="text-text-slate-medium hover:text-text-slate-dark bg-transparent border-none text-lg cursor-pointer">&times;</button>
              </div>

              <div className="p-5 flex flex-col gap-4">
                <div className="flex gap-3 items-center">
                  <img src={activeProgressBook.coverImage} alt="" className="w-10 h-14 object-cover rounded-md border border-border-light-gray shrink-0 shadow-3xs" />
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-bold text-text-slate-dark truncate">{activeProgressBook.title}</h4>
                    <p className="text-[10px] text-text-slate-medium">{activeProgressBook.author}</p>
                    <p className="text-[9px] text-text-slate-light font-bold">Total: {activeProgressBook.totalPages} hal</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 bg-gray-50/50 border border-border-light-gray/40 rounded-xl p-3">
                  <label className="text-[10px] font-extrabold text-text-slate-medium uppercase tracking-wider">Halaman Terbaca:</label>
                  <div className="flex gap-3 items-center">
                    <input type="range" min="0" max={activeProgressBook.totalPages} value={quickProgressPage}
                      onChange={e => setQuickProgressPage(Math.max(0, Math.min(parseInt(e.target.value) || 0, activeProgressBook.totalPages)))}
                      className="flex-1 accent-brand-orange h-1" />
                    <div className="flex items-center gap-1 shrink-0">
                      <input type="number" min="0" max={activeProgressBook.totalPages} value={quickProgressPage}
                        onChange={e => setQuickProgressPage(Math.max(0, Math.min(parseInt(e.target.value) || 0, activeProgressBook.totalPages)))}
                        className="w-12 text-center text-xs font-bold border border-border-light-gray rounded-md p-1 focus:outline-none focus:border-brand-orange bg-white" />
                      <span className="text-[10px] text-text-slate-light font-bold">/ {activeProgressBook.totalPages}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-text-slate-medium uppercase tracking-wider">Rating (1-5 Bintang):</label>
                  <div className="flex items-center gap-1.5">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} type="button" onClick={() => setQuickProgressRating(star)}
                        className="bg-transparent border-none p-0 cursor-pointer text-xl hover:scale-110 transition-transform">
                        <span className="font-sans text-brand-orange">{star <= quickProgressRating ? '★' : '☆'}</span>
                      </button>
                    ))}
                    {quickProgressRating > 0 && (
                      <button type="button" onClick={() => setQuickProgressRating(0)}
                        className="text-[9px] font-bold text-text-slate-light hover:text-brand-orange bg-transparent border-none ml-1 cursor-pointer">Hapus</button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-text-slate-medium uppercase tracking-wider">Catatan / Kutipan (Opsional):</label>
                  <textarea rows={2} value={quickProgressNote} onChange={e => setQuickProgressNote(e.target.value)}
                    placeholder="Tulis pemikiran atau kutipan favorit..."
                    className="input-field w-full px-3 py-2 rounded-lg text-xs focus:outline-none resize-none bg-gray-50" />
                </div>

                {isOwnProfile && userShelves.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-text-slate-medium uppercase tracking-wider">Masukkan ke Rak:</label>
                    <div className="flex flex-col gap-1 max-h-24 overflow-y-auto border border-border-light-gray rounded-xl p-2 bg-gray-50">
                      {userShelves.map(shelf => (
                        <label key={shelf.id} className="flex items-center gap-2 px-2 py-1 hover:bg-white rounded-md cursor-pointer text-xs font-medium text-text-slate-medium select-none">
                          <input type="checkbox" checked={quickSelectedShelves.includes(shelf.id)}
                            onChange={() => handleToggleShelfInModal(shelf.id)} className="accent-brand-orange cursor-pointer" />
                          {shelf.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end p-4 border-t border-border-light-gray bg-bg-light-gray/40">
                <button type="button" onClick={() => setActiveProgressBook(null)} className="btn-secondary py-1.5 px-4 text-xs font-bold rounded-lg">Batal</button>
                <button type="button" onClick={handleSaveQuickProgress} className="btn-primary py-1.5 px-4 text-xs font-bold rounded-lg">Simpan Progres</button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
