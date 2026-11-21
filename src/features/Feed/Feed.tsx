"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useApp, translations } from '../../context/AppContext';
import { Card } from '../../components/Card';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { Modal } from '../../components/Modal';
import { BookCover, UserAvatar } from '../../components/Media';
import { formatRelativeTime } from '../../lib/dateUtils';
import { MessageSquare, Bookmark, Quote, BookOpen, Send, Star, ChevronDown, Check, Image, X, Heart } from 'lucide-react';
import { compressImageFileToDataUrl } from '../../lib/storage';
import { computePercent } from '../../lib/idAndMath';
import { isAllowedImageMime, RASTER_IMAGE_ACCEPT } from '../../lib/uploadValidation';
import type { Book, ReadingProgress, Story, User } from '../../types';

export const Feed: React.FC = () => {
  const { 
    posts, 
    currentUser, 
    books, 
    readingProgress, 
    addPost, 
    likePost, 
    addComment, 
    updateProgress, 
    goals, 
    setViewedUser, 
    setCurrentTab, 
    users, 
    viewBookDetails,
    stories,
    addStory,
    savedPostIds,
    toggleSavePost,
    deletePost,
    language,
    showToast
  } = useApp();
  
  // Post creator state
  const [postType, setPostType] = useState<'QUOTE' | 'THOUGHT' | 'PHOTO'>('QUOTE');
  const [content, setContent] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);
  // Photo specific state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Stories active state
  const [activeStoryUserId, setActiveStoryUserId] = useState<string | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  
  // Story creator modal state
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [storyBookTitle, setStoryBookTitle] = useState('');

  // Group stories by userId (only unique users)
  const groupedStories = stories.reduce<Story[]>((acc, story) => {
    if (!acc.some(s => s.userId === story.userId)) {
      acc.push(story);
    }
    return acc;
  }, []);

  const activeUserStories = stories.filter(s => s.userId === activeStoryUserId);

  // Auto-advance story timer
  useEffect(() => {
    if (activeStoryUserId && activeUserStories.length > 0) {
      const timer = setTimeout(() => {
        if (activeStoryIndex < activeUserStories.length - 1) {
          setActiveStoryIndex(prev => prev + 1);
        } else {
          setActiveStoryUserId(null);
          setActiveStoryIndex(0);
        }
      }, 5000); // 5 seconds per story
      return () => clearTimeout(timer);
    }
  }, [activeStoryUserId, activeStoryIndex, activeUserStories.length]);
  
  // Comment State (per post)
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const commentInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Feed filter / customize state
  const [showCustomizeFilter, setShowCustomizeFilter] = useState(false);
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'QUOTE' | 'THOUGHT' | 'PHOTO' | 'PROGRESS_UPDATE'>('ALL');
  const [openShelfMenuPostId, setOpenShelfMenuPostId] = useState<string | null>(null);

  // Quick Progress Logger State in Sidebar widget
  const [activeLogBookId, setActiveLogBookId] = useState<string | null>(null);
  const [logPage, setLogPage] = useState<number>(0);

  const currentYear = new Date().getFullYear();
  const userGoal = goals.find((g) => g.userId === currentUser.id && g.year === currentYear) || {
    targetBooks: 12,
    completedBooksCount: 0
  };

  const handleUserClick = (userId: string, displayName: string, avatar: string) => {
    if (userId === currentUser.id) {
      setViewedUser(null);
      setCurrentTab('profile');
      return;
    }
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setViewedUser(foundUser);
    } else {
      setViewedUser({
        id: userId,
        username: displayName.toLowerCase().replace(/\s+/g, ''),
        displayName: displayName,
        avatar: avatar,
        bio: 'Pengguna terverifikasi Google.'
      });
    }
    setCurrentTab('profile');
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (postType === 'PHOTO') {
      if (!photoPreview) return;
      addPost('PHOTO', content.trim() || '', selectedBookId || undefined, undefined, undefined, photoPreview);
      setContent('');
      setSelectedBookId('');
      setPhotoPreview(null);
    } else {
      if (!content.trim()) return;
      addPost(postType, content, selectedBookId || undefined);
      setContent('');
      setSelectedBookId('');
    }
  };

  const handlePhotoChange = (file: File) => {
    if (!file || !isAllowedImageMime(file.type)) {
      showToast(language === 'id' ? 'Format foto harus JPG, PNG, WebP, atau GIF.' : 'Photo format must be JPG, PNG, WebP, or GIF.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(language === 'id' ? 'Ukuran gambar maksimal 5MB.' : 'Maximum image size is 5MB.', 'error');
      return;
    }
    compressImageFileToDataUrl(file)
      .then((dataUrl) => setPhotoPreview(dataUrl))
      .catch(() => {
        showToast(language === 'id' ? 'Gagal membaca file gambar.' : 'Failed to read image file.', 'error');
      });
  };

  const handleCommentSubmit = (postId: string) => {
    const commentText = commentInputs[postId] || '';
    if (!commentText.trim()) return;

    addComment(postId, commentText);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleQuickLogProgress = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    const pageNum = Math.max(0, Math.min(logPage, book.totalPages));
    const status = pageNum === book.totalPages ? 'COMPLETED' : 'READING';
    
    updateProgress(bookId, pageNum, status);
    setActiveLogBookId(null);
  };

  const formatDate = (dateStr: string) =>
    formatRelativeTime(dateStr, language, new Date(), {
      compact: true,
      fallbackToDateAfterHours: 24,
    });

  // Find Currently Reading books
  const userProgress = readingProgress.filter((p) => p.userId === currentUser.id);
  const currentlyReadingProgress = userProgress.filter((p) => p.status === 'READING');
  const currentlyReadingBooks = books.filter((b) => 
    currentlyReadingProgress.some((p) => p.bookId === b.id)
  );

  // Recommendations (Mock)
  const recommendedBook = books.find((b) => b.id === 'b4') || books[0];

  const filteredFeedPosts = feedFilter === 'ALL' ? posts : posts.filter((p) => p.type === feedFilter);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2.2fr_1fr] gap-8 items-start animate-fade-in">
      
      {/* ================= LEFT COLUMN: FEED & UPDATES ================= */}
      <div className="flex flex-col gap-6">
        
        {/* ================= STORIES BAR ================= */}
        <div className="flex gap-4 p-4 bg-white border border-border-light-gray rounded-xl overflow-x-auto select-none scrollbar-none items-center shadow-xs">
          
          {/* Add story button for Current User */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowCreateStory(true)}
              aria-label={language === 'id' ? 'Buat cerita baru' : 'Create new story'}
              className="relative w-15 h-15 cursor-pointer active-pop hover-scale bg-transparent border-none p-0 rounded-full"
            >
              <UserAvatar
                src={currentUser.avatar}
                alt={currentUser.displayName}
                width={60}
                height={60}
                className="w-full h-full rounded-full object-cover border-2 border-white ring-2 ring-gray-200"
              />
              <span className="absolute right-0 bottom-0 bg-brand-orange text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-2xs" aria-hidden="true">
                +
              </span>
            </button>
            <span className="text-[10px] text-text-slate-medium font-semibold">{language === 'id' ? 'Cerita Anda' : 'Your Story'}</span>
          </div>

          {/* Grouped stories by other users */}
          {groupedStories.map((story) => {
            const isOwn = story.userId === currentUser.id;
            return (
              <div key={story.id} className="flex flex-col items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStoryUserId(story.userId);
                    setActiveStoryIndex(0);
                  }}
                  aria-label={isOwn ? (language === 'id' ? 'Lihat cerita Anda' : 'View your story') : `${story.userDisplayName}`}
                  className="w-15 h-15 rounded-full p-[2.5px] cursor-pointer active-pop hover-scale border-none bg-gradient-to-tr from-brand-orange via-rose-500 to-amber-400"
                >
                  <UserAvatar
                    src={story.userAvatar}
                    alt={story.userDisplayName}
                    width={60}
                    height={60}
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                  />
                </button>
                <span className="text-[10px] text-text-slate-medium font-semibold truncate max-w-[70px]">
                  {isOwn ? (language === 'id' ? 'Cerita Anda' : 'Your Story') : story.userDisplayName}
                </span>
              </div>
            );
          })}

        </div>

        {/* Share thoughts container */}
        <Card hoverable={false} className="p-4">
          <form onSubmit={handlePostSubmit} className="flex flex-col gap-3">
            {/* Post type tabs */}
            <div className="flex gap-4 border-b border-border-light-gray pb-2.5">
              <button
                type="button"
                onClick={() => { setPostType('QUOTE'); setPhotoPreview(null); }}
                className={`bg-transparent border-none font-bold text-xs cursor-pointer flex items-center gap-1.5 pb-1.5 border-b-2 transition-all ${
                  postType === 'QUOTE' ? 'text-brand-orange border-brand-orange' : 'text-text-slate-medium border-transparent'
                }`}
              >
                <Quote size={14} />
                {language === 'id' ? 'Kutipan' : 'Quote'}
              </button>
              <button
                type="button"
                onClick={() => { setPostType('THOUGHT'); setPhotoPreview(null); }}
                className={`bg-transparent border-none font-bold text-xs cursor-pointer flex items-center gap-1.5 pb-1.5 border-b-2 transition-all ${
                  postType === 'THOUGHT' ? 'text-brand-orange border-brand-orange' : 'text-text-slate-medium border-transparent'
                }`}
              >
                <MessageSquare size={14} />
                {language === 'id' ? 'Ulasan' : 'Review'}
              </button>
              <button
                type="button"
                onClick={() => { setPostType('PHOTO'); setContent(''); }}
                className={`bg-transparent border-none font-bold text-xs cursor-pointer flex items-center gap-1.5 pb-1.5 border-b-2 transition-all ${
                  postType === 'PHOTO' ? 'text-brand-orange border-brand-orange' : 'text-text-slate-medium border-transparent'
                }`}
              >
                <Image size={14} />
                {language === 'id' ? 'Foto' : 'Photo'}
              </button>
            </div>

            {/* PHOTO mode: drag-drop / upload area */}
            {postType === 'PHOTO' ? (
              <div className="flex flex-col gap-3">
                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border-light-gray">
                    <BookCover src={photoPreview} alt="Preview" width={600} height={320} className="w-full max-h-72 object-cover" />
                    <button
                      type="button"
                      aria-label={language === 'id' ? 'Hapus pratinjau foto' : 'Remove photo preview'}
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white cursor-pointer border-none hover:bg-black/80 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file) handlePhotoChange(file);
                    }}
                    onClick={() => photoInputRef.current?.click()}
                    className={`w-full bg-transparent flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl py-10 cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-brand-orange bg-brand-orange/5' 
                        : 'border-border-light-gray hover:border-brand-orange/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center">
                      <Image size={22} className="text-brand-orange" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-text-slate-dark">{language === 'id' ? 'Klik atau seret foto di sini' : 'Click or drag photo here'}</p>
                      <p className="text-[11px] text-text-slate-light mt-0.5">JPG, PNG, GIF • Max 5MB</p>
                    </div>
                  </button>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept={RASTER_IMAGE_ACCEPT}
                  aria-label={language === 'id' ? 'Unggah foto postingan' : 'Upload post photo'}
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f); e.target.value = ''; }}
                />
                <textarea
                  aria-label={language === 'id' ? 'Keterangan foto' : 'Photo caption'}
                  className="w-full bg-white text-text-slate-dark text-sm p-1 resize-none min-h-[50px] focus-visible:ring-2 focus-visible:ring-brand-orange/40 rounded"
                  rows={2}
                  placeholder={language === 'id' ? 'Tambah keterangan foto... (opsional)' : 'Add photo caption... (optional)'}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>
            ) : (
              <textarea
                aria-label={postType === 'QUOTE' ? (language === 'id' ? 'Tulis kutipan' : 'Write quote') : (language === 'id' ? 'Tulis ulasan' : 'Write review')}
                className="w-full bg-white text-text-slate-dark text-sm p-1 resize-y min-h-[60px] focus-visible:ring-2 focus-visible:ring-brand-orange/40 rounded"
                rows={2}
                placeholder={
                  postType === 'QUOTE'
                    ? (language === 'id' ? 'Bagikan kutipan inspiratif dari buku yang Anda baca...' : 'Share an inspiring quote from the book you are reading...')
                    : (language === 'id' ? 'Tulis ulasan ringkas atau pemikiran Anda di sini...' : 'Write a short review or your thoughts here...')
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            )}

            <div className="flex flex-wrap gap-3 justify-between items-center border-t border-border-light-gray pt-2.5">
              <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                <Bookmark size={16} className="text-text-slate-light" />
                <select
                  aria-label={language === 'id' ? 'Hubungkan dengan Buku' : 'Connect with Book'}
                  className="w-full bg-bg-light-gray text-text-slate-dark text-xs p-1.5 rounded-md border border-transparent focus-visible:ring-2 focus-visible:ring-brand-orange/40"
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                >
                  <option value="">{language === 'id' ? 'Hubungkan dengan Buku' : 'Connect with Book'}</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <button 
                type="submit" 
                className="btn-primary"
                disabled={postType === 'PHOTO' ? !photoPreview : !content.trim()}
              >
                {translations[language].postButton}
              </button>
            </div>
          </form>
        </Card>

        {/* Updates list header */}
        <div className="flex flex-col gap-2 border-b border-border-light-gray pb-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-text-slate-dark">{translations[language].updates}</h3>
            <button
              type="button"
              onClick={() => setShowCustomizeFilter((prev) => !prev)}
              className="text-xs text-text-slate-medium cursor-pointer hover:underline bg-transparent border-none font-semibold"
            >
              {language === 'id' ? 'Kustomisasi' : 'Customize'}
            </button>
          </div>
          {showCustomizeFilter && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {([
                { id: 'ALL', label: language === 'id' ? 'Semua' : 'All' },
                { id: 'QUOTE', label: language === 'id' ? 'Kutipan' : 'Quotes' },
                { id: 'THOUGHT', label: language === 'id' ? 'Ulasan' : 'Reviews' },
                { id: 'PHOTO', label: language === 'id' ? 'Foto' : 'Photos' },
                { id: 'PROGRESS_UPDATE', label: language === 'id' ? 'Progres' : 'Progress' },
              ] as const).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFeedFilter(opt.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-colors ${
                    feedFilter === opt.id
                      ? 'bg-brand-orange text-white border-brand-orange'
                      : 'bg-white text-text-slate-medium border-border-light-gray hover:border-brand-orange'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Feed Posts */}
        {filteredFeedPosts.length === 0 ? (
          <Card hoverable={false} className="p-8 text-center flex flex-col items-center gap-2">
            <BookOpen size={28} className="text-brand-orange/70" />
            <h4 className="text-sm font-bold text-text-slate-dark">
              {language === 'id' ? 'Belum ada aktivitas di beranda' : 'No activity in your feed yet'}
            </h4>
            <p className="text-xs text-text-slate-medium max-w-sm">
              {language === 'id'
                ? 'Bagikan kutipan atau tambahkan buku ke perpustakaan Anda untuk memulai.'
                : 'Share a quote or add a book to your library to get started.'}
            </p>
            <button
              type="button"
              onClick={() => setCurrentTab('books')}
              className="btn-primary text-xs mt-2"
            >
              {translations[language].addBook}
            </button>
          </Card>
        ) : filteredFeedPosts.map((post) => {
          const isLiked = post.likes.includes(currentUser.id);
          const postBook = books.find((b) => b.id === post.bookId);
          
          return (
            <Card key={post.id} hoverable={false} className="p-6 flex flex-col gap-4">
              
              {/* Header: User Profile, Activity, Time */}
              <div className="flex gap-3 items-start">
                <button
                  type="button"
                  onClick={() => handleUserClick(post.userId, post.userDisplayName, post.userAvatar)}
                  aria-label={post.userDisplayName}
                  className="p-0 border-none bg-transparent cursor-pointer rounded-full shrink-0"
                >
                  <UserAvatar
                    src={post.userAvatar}
                    alt={post.userDisplayName}
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover hover:opacity-80 transition-opacity"
                  />
                </button>
                <div className="flex-1">
                  <div className="text-sm text-text-slate-dark leading-relaxed">
                    <button
                      type="button"
                      onClick={() => handleUserClick(post.userId, post.userDisplayName, post.userAvatar)}
                      className="bg-transparent border-none p-0 font-bold text-text-slate-dark cursor-pointer hover:text-brand-orange hover:underline transition-all"
                    >
                      {post.userDisplayName}
                    </button>{' '}
                    {post.type === 'PROGRESS_UPDATE' ? (
                      post.currentPage && post.totalPages && post.currentPage === post.totalPages ? (
                        <span>{language === 'id' ? 'menyelesaikan membaca' : 'finished reading'} <strong className="font-semibold">{post.bookTitle}</strong></span>
                      ) : (
                        <span>{language === 'id' ? 'memperbarui progres di' : 'updated progress in'} <strong className="font-semibold">{post.bookTitle}</strong></span>
                      )
                    ) : post.type === 'QUOTE' ? (
                      <span>{language === 'id' ? 'membagikan kutipan dari' : 'shared a quote from'} <strong className="font-semibold">{post.bookTitle}</strong></span>
                    ) : (
                      <span>{language === 'id' ? 'menulis ulasan untuk' : 'wrote a review for'} <strong className="font-semibold">{post.bookTitle}</strong></span>
                    )}
                  </div>
                  <div className="text-xs text-text-slate-light mt-0.5">
                    {formatDate(post.createdAt)}
                  </div>
                </div>
              </div>

              {/* Progress update bar if applicable */}
              {post.type === 'PROGRESS_UPDATE' && post.currentPage && post.totalPages && (
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-orange" 
                      style={{ 
                        width: `${Math.round((post.currentPage / post.totalPages) * 100)}%` 
                      }} 
                    />
                  </div>
                  <span className="text-xs text-text-slate-medium font-semibold min-w-[85px] text-right">
                    {language === 'id' ? `hal ${post.currentPage} dari ${post.totalPages}` : `page ${post.currentPage} of ${post.totalPages}`}
                  </span>
                </div>
              )}

              {/* Connected Book Detail Box */}
              {postBook && (
                <div className="flex gap-4 p-4 rounded-md bg-[#fafbfc] border border-border-light-gray">
                  <button
                    type="button"
                    onClick={() => viewBookDetails(postBook)}
                    aria-label={postBook.title}
                    className="p-0 border-none bg-transparent cursor-pointer shrink-0 rounded-md"
                  >
                    <BookCover
                      src={postBook.coverImage}
                      alt={postBook.title}
                      width={60}
                      height={80}
                      className="w-15 h-20 object-cover rounded-md border border-border-light-gray hover:opacity-85 transition-opacity"
                    />
                  </button>
                  <div className="flex-1 flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-text-slate-dark leading-snug">
                      <button
                        type="button"
                        onClick={() => viewBookDetails(postBook)}
                        className="text-left bg-transparent border-none p-0 font-bold text-text-slate-dark cursor-pointer hover:text-brand-orange hover:underline"
                      >
                        {postBook.title}
                      </button>
                    </h4>
                    <p className="text-xs text-text-slate-medium">
                      {language === 'id' ? 'oleh' : 'by'} {postBook.author}
                    </p>
                    {post.rating && post.rating > 0 && (
                      <div className="flex gap-0.5 text-amber-500 my-1 shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={12} 
                            fill={star <= (post.rating || 0) ? "currentColor" : "none"} 
                            className="stroke-1"
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-text-slate-light line-clamp-2 leading-relaxed">
                      {post.content || (language === 'id' ? 'Melacak perjalanan membaca bersama komunitas AKRA.' : 'Tracking reading journey with the AKRA community.')}
                    </p>
                  </div>
                </div>
              )}

              {/* PHOTO post */}
              {post.type === 'PHOTO' && post.imageUrl && (
                <div className="flex flex-col gap-0 rounded-xl overflow-hidden border border-border-light-gray">
                  <BookCover
                    src={post.imageUrl}
                    alt="Foto postingan"
                    width={640}
                    height={420}
                    className="w-full object-cover max-h-[420px]"
                  />
                  {post.content && (
                    <div className="px-4 py-3 bg-white text-sm text-text-slate-dark leading-relaxed">
                      {post.content}
                    </div>
                  )}
                </div>
              )}

              {/* If it's a raw Quote or Thought (without book detail) or display quote styled */}
              {post.type === 'QUOTE' && !postBook && (
                <div className="font-serif italic border-l-3 border-brand-orange pl-3 text-text-slate-dark text-sm">
                  {post.content}
                </div>
              )}

              {post.type === 'THOUGHT' && !postBook && (
                <div className="text-text-slate-dark text-sm leading-relaxed">
                  {post.content}
                </div>
              )}

              {/* Card Action Buttons (Like, Comment, Rate It) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-t border-border-light-gray pt-3 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    onClick={() => likePost(post.id)}
                    className={`bg-transparent border-none font-semibold cursor-pointer flex items-center gap-1 transition-colors active-pop ${
                      isLiked ? 'text-brand-orange animate-pop' : 'text-text-slate-medium hover:text-brand-orange'
                    }`}
                  >
                    {translations[language].like}
                  </button>
                  <button
                    type="button"
                    onClick={() => commentInputRefs.current[post.id]?.focus()}
                    className="bg-transparent border-none font-semibold text-text-slate-medium hover:text-text-slate-dark cursor-pointer active-pop"
                  >
                    {translations[language].comment}
                  </button>
                  <button
                    onClick={() => toggleSavePost(post.id)}
                    className={`bg-transparent border-none font-semibold cursor-pointer flex items-center gap-1 transition-colors active-pop ${
                      savedPostIds.includes(post.id) ? 'text-brand-orange animate-pop' : 'text-text-slate-medium hover:text-brand-orange'
                    }`}
                  >
                    <Bookmark size={14} className={savedPostIds.includes(post.id) ? 'fill-current' : ''} />
                    <span>{savedPostIds.includes(post.id) ? translations[language].saved : translations[language].save}</span>
                  </button>
                  {post.userId === currentUser.id && (
                    <button
                      onClick={() => setDeleteConfirmPostId(post.id)}
                      className="bg-transparent border-none font-semibold cursor-pointer flex items-center gap-1 text-text-slate-medium hover:text-red-500 transition-colors active-pop"
                    >
                      <X size={14} />
                      <span>{translations[language].delete}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3.5 flex-wrap justify-between sm:justify-end">
                  {/* Rating Display */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-text-slate-light text-[10px]">{translations[language].rateIt}</span>
                    <div className="flex gap-0.5" role="radiogroup" aria-label={translations[language].rateIt}>
                      {(() => {
                        const currentRating = post.rating || (post.bookId ? (readingProgress.find(p => p.userId === currentUser.id && p.bookId === post.bookId)?.rating || 0) : 0);
                        return [1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            aria-label={`${star} ${language === 'id' ? 'bintang' : 'stars'}`}
                            onClick={() => {
                              if (post.bookId) {
                                const prog = readingProgress.find(p => p.userId === currentUser.id && p.bookId === post.bookId);
                                const currentPage = prog ? prog.currentPage : 0;
                                const status = prog ? prog.status : 'READING';
                                updateProgress(post.bookId, currentPage, status, star);
                              }
                            }}
                            className="bg-transparent border-none p-0.5 cursor-pointer"
                          >
                            <Star 
                              size={14} 
                              className={`hover:scale-115 transition-transform ${
                                star <= currentRating
                                  ? "text-yellow-500 fill-current" 
                                  : "text-gray-300 fill-none"
                              }`} 
                            />
                          </button>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Want to Read button */}
                  {postBook && (
                    <div className="relative flex shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          updateProgress(postBook.id, 0, 'WANT_TO_READ');
                          setOpenShelfMenuPostId(null);
                        }}
                        className="bg-brand-cocoa text-white rounded-l border-none px-3 py-1.5 text-[10px] font-extrabold hover:bg-brand-cocoa-hover cursor-pointer flex items-center gap-1.5"
                      >
                        {translations[language].wantToRead}
                      </button>
                      <button
                        type="button"
                        aria-label={language === 'id' ? 'Pilih status rak buku' : 'Choose bookshelf status'}
                        onClick={() => setOpenShelfMenuPostId(openShelfMenuPostId === post.id ? null : post.id)}
                        className="bg-brand-cocoa text-white rounded-r border-none border-l border-white/20 px-1.5 py-1.5 text-[10px] hover:bg-brand-cocoa-hover cursor-pointer flex items-center justify-center"
                      >
                        <ChevronDown size={10} />
                      </button>
                      {openShelfMenuPostId === post.id && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-border-light-gray rounded-md shadow-md p-1 z-30">
                          {([
                            { id: 'WANT_TO_READ', label: translations[language].wantToRead },
                            { id: 'READING', label: translations[language].currentlyReading },
                            { id: 'COMPLETED', label: translations[language].read },
                          ] as const).map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                updateProgress(
                                  postBook.id,
                                  opt.id === 'COMPLETED' ? postBook.totalPages : 0,
                                  opt.id
                                );
                                setOpenShelfMenuPostId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-text-slate-dark hover:bg-gray-100 rounded bg-transparent border-none cursor-pointer"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Nested Comments & Input */}
              <div className="flex flex-col gap-2.5 bg-[#fafbfc] p-3 rounded-md border border-border-light-gray">
                {/* Existing comments */}
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 items-start text-xs">
                    <button
                      type="button"
                      onClick={() => handleUserClick(comment.userId, comment.displayName, comment.avatar)}
                      aria-label={comment.displayName}
                      className="p-0 border-none bg-transparent cursor-pointer rounded-full shrink-0"
                    >
                      <UserAvatar
                        src={comment.avatar}
                        alt={comment.displayName}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full object-cover hover:opacity-80 transition-opacity"
                      />
                    </button>
                    <div className="flex-1">
                      <div>
                        <button
                          type="button"
                          onClick={() => handleUserClick(comment.userId, comment.displayName, comment.avatar)}
                          className="bg-transparent border-none p-0 font-bold text-text-slate-dark mr-1 cursor-pointer hover:text-brand-orange hover:underline transition-all"
                        >
                          {comment.displayName}
                        </button>{' '}
                        <span className="text-text-slate-medium">{comment.content}</span>
                      </div>
                      <div className="text-[10px] text-text-slate-light mt-0.5">
                        {formatDate(comment.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Inline Comment Input Box */}
                <div className="flex gap-2 items-center">
                  <UserAvatar
                    src={currentUser.avatar}
                    alt={currentUser.displayName}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="flex-1 relative">
                    <input
                      ref={(el) => { commentInputRefs.current[post.id] = el; }}
                      type="text"
                      aria-label={translations[language].writeCommentPlaceholder}
                      className="input-field w-full pr-9 text-xs bg-white border border-border-light-gray rounded-md h-8 focus-visible:ring-2 focus-visible:ring-brand-orange/40 focus:border-brand-orange transition-all"
                      placeholder="Tulis komentar..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommentSubmit(post.id);
                      }}
                    />
                    <button
                      type="button"
                      aria-label={language === 'id' ? 'Kirim komentar' : 'Send comment'}
                      onClick={() => handleCommentSubmit(post.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-brand-orange cursor-pointer flex items-center"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </div>

            </Card>
          );
        })}

      </div>

      {/* ================= RIGHT COLUMN: SIDEBAR WIDGETS ================= */}
      <div className="flex flex-col gap-6">
        
        {/* WIDGET 1: CURRENTLY READING */}
        <Card hoverable={false} className="p-4">
          <h3 className="text-xs font-bold text-text-slate-dark mb-4 border-b border-border-light-gray pb-2">
            {translations[language].currReadingWidget}
          </h3>
          
          {currentlyReadingBooks.length === 0 ? (
            <p className="text-xs text-text-slate-light my-3">
              {translations[language].noActiveBooks}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {currentlyReadingBooks.map((book) => {
                const progress = currentlyReadingProgress.find((p) => p.bookId === book.id);
                const currentPage = progress ? progress.currentPage : 0;
                
                return (
                  <div key={book.id} className="flex gap-3 items-start">
                    <button
                      type="button"
                      onClick={() => viewBookDetails(book)}
                      aria-label={book.title}
                      className="p-0 border-none bg-transparent cursor-pointer shrink-0 rounded-md"
                    >
                      <BookCover
                        src={book.coverImage}
                        alt={book.title}
                        width={44}
                        height={64}
                        className="w-11 h-16 object-cover rounded-md border border-border-light-gray hover:opacity-85 transition-opacity"
                      />
                    </button>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <h4 className="text-xs font-bold text-text-slate-dark truncate">
                        <button
                          type="button"
                          onClick={() => viewBookDetails(book)}
                          className="text-left bg-transparent border-none p-0 font-bold text-text-slate-dark truncate w-full cursor-pointer hover:text-brand-orange hover:underline"
                        >
                          {book.title}
                        </button>
                      </h4>
                      <p className="text-[11px] text-text-slate-medium truncate">
                        {language === 'id' ? 'oleh' : 'by'} {book.author}
                      </p>
                      
                      {activeLogBookId === book.id ? (
                        <div className="flex gap-1.5 items-center mt-1">
                          <input
                            type="number"
                            aria-label={language === 'id' ? `Halaman saat ini untuk ${book.title}` : `Current page for ${book.title}`}
                            value={logPage}
                            onChange={(e) => setLogPage(parseInt(e.target.value) || 0)}
                            className="w-11 text-xs p-1 border border-border-light-gray rounded-md bg-white text-center focus-visible:ring-2 focus-visible:ring-brand-orange/40"
                          />
                          <span className="text-[10px] text-text-slate-light">/ {book.totalPages}</span>
                          <button 
                            type="button"
                            aria-label={language === 'id' ? 'Simpan progres' : 'Save progress'}
                            onClick={() => handleQuickLogProgress(book.id)} 
                            className="bg-brand-orange text-white border-none rounded-md p-1 cursor-pointer flex items-center"
                          >
                            <Check size={10} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-secondary self-start py-0.5 px-3 rounded-full text-[10px]"
                          onClick={() => {
                            setActiveLogBookId(book.id);
                            setLogPage(currentPage);
                          }}
                        >
                          {language === 'id' ? 'Perbarui Progres' : 'Update Progress'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-border-light-gray mt-4 pt-2 flex gap-2 text-[10px] text-text-slate-medium">
            <button type="button" onClick={() => setCurrentTab('books')} className="hover:underline cursor-pointer bg-transparent border-none p-0 text-[10px] text-text-slate-medium">{translations[language].viewAll}</button> • <button type="button" className="hover:underline cursor-pointer bg-transparent border-none p-0 text-[10px] text-text-slate-medium" onClick={() => setCurrentTab('books')}>{translations[language].addBook}</button>
          </div>
        </Card>        {/* WIDGET 2: RECOMMENDATION FROM BOOKMATES */}
        <Card hoverable={false} className="p-4">
          <h3 className="text-xs font-bold text-text-slate-dark mb-4 border-b border-border-light-gray pb-2">
            {translations[language].recomBookmates}
          </h3>

          {(() => {
            interface FriendRecommendation {
              book: Book;
              friend: User;
              status: ReadingProgress['status'];
              updatedAt: string;
            }
            const friendsProgress = readingProgress.filter((p) => p.userId !== currentUser.id && (p.status === 'READING' || p.status === 'COMPLETED'));
            const friendRecommendations = friendsProgress.reduce<FriendRecommendation[]>((acc, progressItem) => {
              const book = books.find((b) => b.id === progressItem.bookId);
              const friend = users.find((u) => u.id === progressItem.userId);
              if (book && friend && !acc.some(item => item.book.id === book.id)) {
                acc.push({
                  book,
                  friend,
                  status: progressItem.status,
                  updatedAt: progressItem.updatedAt
                });
              }
              return acc;
            }, []).slice(0, 3);
            if (friendRecommendations.length === 0) {
              return (
                <div className="text-center py-4 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-brand-orange-glow flex items-center justify-center text-brand-orange text-xs font-bold mb-2">
                    👥
                  </div>
                  <p className="text-xs text-text-slate-dark font-bold">
                    {translations[language].noRecommendations}
                  </p>
                  <p className="text-[10px] text-text-slate-medium text-center max-w-[180px] mt-1 leading-normal">
                    {translations[language].inviteFriends}
                  </p>
                </div>
              );
            }

            return (
              <div className="flex flex-col gap-4">
                {friendRecommendations.map((item) => (
                  <div key={item.book.id} className="flex gap-3 items-start border-b border-border-light-gray/40 pb-3 last:border-b-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => viewBookDetails(item.book)}
                      aria-label={item.book.title}
                      className="p-0 border-none bg-transparent cursor-pointer shrink-0 rounded-md"
                    >
                      <BookCover
                        src={item.book.coverImage}
                        alt={item.book.title}
                        width={44}
                        height={64}
                        className="w-11 h-16 object-cover rounded-md border border-border-light-gray hover:opacity-85 transition-opacity shadow-xs"
                      />
                    </button>
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <h4 className="text-xs font-bold text-text-slate-dark truncate">
                        <button
                          type="button"
                          onClick={() => viewBookDetails(item.book)}
                          className="text-left bg-transparent border-none p-0 font-bold text-text-slate-dark truncate w-full cursor-pointer hover:text-brand-orange hover:underline"
                        >
                          {item.book.title}
                        </button>
                      </h4>
                      <p className="text-[10px] text-text-slate-medium truncate mb-0.5">
                        oleh {item.book.author}
                      </p>
                      
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <UserAvatar src={item.friend.avatar} alt="" width={14} height={14} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                        <span className="text-[9px] font-bold text-text-slate-light leading-none">
                          {item.status === 'COMPLETED' ? 'Selesai dibaca oleh ' : 'Sedang dibaca oleh '}
                          <span className="text-text-slate-medium">{item.friend.displayName}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </Card>

        {/* WIDGET 3: READING CHALLENGE */}
        <Card hoverable={false} className="p-4">
          <h3 className="text-xs font-bold text-text-slate-dark mb-4 border-b border-border-light-gray pb-2">
            {language === 'id' ? 'Tantangan Membaca' : 'Reading Challenge'} {currentYear}
          </h3>

          <div className="flex gap-4 items-center">
            {/* Custom SVG book stack illustration */}
            <svg width="45" height="55" viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 60h45v8H5z" className="fill-brand-orange" />
              <path d="M12 48h38v8H12z" className="fill-brand-orange-hover" />
              <path d="M8 36h42v8H8z" fill="#403020" />
              <path d="M15 24h35v8H15z" className="fill-brand-orange" />
              <path d="M10 12h40v8H10z" className="fill-text-slate-light" />
              <circle cx="35" cy="5" r="4" fill="#fbbf24" />
            </svg>
            
            <div className="flex-1">
              <div className="text-2xl font-extrabold text-text-slate-dark leading-none">
                {userGoal.completedBooksCount}
              </div>
              <div className="text-[10px] text-text-slate-medium mb-2">
                {language === 'id' ? 'buku selesai dibaca' : 'books completed'}
              </div>

              {/* Mini progress bar */}
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-1">
                <div 
                  className="h-full bg-brand-orange" 
                  style={{ 
                    width: `${computePercent(userGoal.completedBooksCount, userGoal.targetBooks)}%` 
                  }} 
                />
              </div>
              <div className="flex justify-between text-[9px] text-text-slate-light">
                <span>{userGoal.completedBooksCount} {language === 'id' ? 'dari' : 'of'} {userGoal.targetBooks}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setViewedUser(null);
              setCurrentTab('profile');
            }}
            className="btn-secondary w-full justify-center py-1 px-3 rounded-full text-xs mt-4"
          >
            {language === 'id' ? 'Lihat Target' : 'View Target'}
          </button>
        </Card>

      </div>

      {/* ================= STORY VIEWER OVERLAY ================= */}
      <Modal
        isOpen={Boolean(activeStoryUserId && activeUserStories.length > 0)}
        onClose={() => {
          setActiveStoryUserId(null);
          setActiveStoryIndex(0);
        }}
        ariaLabel={language === 'id' ? 'Penampil cerita' : 'Story viewer'}
        backdropClassName="bg-black/90"
      >
        {activeStoryUserId && activeUserStories.length > 0 && (
          <div className="relative w-full max-w-[380px] h-[70vh] md:h-[75vh] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-b from-[#3a2212] to-[#120a05] flex flex-col justify-between text-white p-5 animate-slide-in">
            
            {/* Top Row: Progress Indicators & Close Button */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-1.5 w-full">
                {activeUserStories.map((_, idx) => (
                  <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-white ${
                        idx < activeStoryIndex 
                          ? 'w-full' 
                          : idx === activeStoryIndex 
                            ? 'animate-story-progress' 
                            : 'w-0'
                      }`} 
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    src={activeUserStories[activeStoryIndex].userAvatar}
                    alt={activeUserStories[activeStoryIndex].userDisplayName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover border border-white/25"
                  />
                  <div>
                    <span className="text-xs font-bold block">{activeUserStories[activeStoryIndex].userDisplayName}</span>
                    <span className="text-[9px] text-white/50 block">Baru saja</span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={language === 'id' ? 'Tutup cerita' : 'Close story'}
                  onClick={() => {
                    setActiveStoryUserId(null);
                    setActiveStoryIndex(0);
                  }}
                  className="bg-transparent border-none text-white/70 hover:text-white cursor-pointer text-xl p-1 active-pop"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Middle: Content Graphic / Text Quote Box */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 text-center gap-6">
              
              {/* If Story is connected with a Book */}
              {activeUserStories[activeStoryIndex].bookTitle && (
                <div className="bg-white/10 backdrop-blur-md border border-white/15 p-2 px-3.5 rounded-full flex items-center gap-2 max-w-[280px] shadow-sm">
                  <BookOpen size={14} className="text-brand-orange shrink-0" />
                  <span className="text-[10px] text-white/90 text-left font-semibold truncate">
                    Membaca: {activeUserStories[activeStoryIndex].bookTitle}
                  </span>
                </div>
              )}

              {/* Story Content Text */}
              <p className="font-serif italic text-base leading-relaxed text-white/95 whitespace-pre-line px-2">
                "{activeUserStories[activeStoryIndex].content}"
              </p>

            </div>

            {/* Bottom: Navigation Buttons */}
            <div className="flex justify-between items-center px-1 text-xs text-white/50 border-t border-white/10 pt-3">
              <button
                type="button"
                disabled={activeStoryIndex === 0}
                onClick={() => setActiveStoryIndex(prev => prev - 1)}
                className="bg-white/10 hover:bg-white/20 text-white rounded px-3 py-1.5 border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active-pop"
              >
                Kembali
              </button>
              <span className="text-[10px] text-white/40 font-medium">
                {activeStoryIndex + 1} dari {activeUserStories.length}
              </span>
              <button
                type="button"
                disabled={activeStoryIndex === activeUserStories.length - 1}
                onClick={() => setActiveStoryIndex(prev => prev + 1)}
                className="bg-white/10 hover:bg-white/20 text-white rounded px-3 py-1.5 border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active-pop"
              >
                Berikutnya
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* ================= STORY CREATOR MODAL ================= */}
      <Modal
        isOpen={showCreateStory}
        onClose={() => {
          setShowCreateStory(false);
          setStoryContent('');
          setStoryBookTitle('');
        }}
        ariaLabel={language === 'id' ? 'Bagikan Cerita Anda' : 'Share Your Story'}
        backdropClassName="bg-black/50"
      >
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-in">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-light-gray bg-bg-light-gray">
              <h3 className="text-sm font-bold text-text-slate-dark">{language === 'id' ? 'Bagikan Cerita Anda' : 'Share Your Story'}</h3>
              <button 
                type="button"
                aria-label={language === 'id' ? 'Tutup modal cerita' : 'Close story modal'}
                onClick={() => {
                  setShowCreateStory(false);
                  setStoryContent('');
                  setStoryBookTitle('');
                }}
                className="text-text-slate-medium hover:text-text-slate-dark bg-transparent border-none text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!storyContent.trim()) return;
                addStory(storyContent, storyBookTitle || undefined);
                setStoryContent('');
                setStoryBookTitle('');
                setShowCreateStory(false);
              }}
              className="p-6 flex flex-col gap-4"
            >
              <div>
                <label htmlFor="story-content-input" className="block text-xs font-semibold text-text-slate-medium mb-1.5">{language === 'id' ? 'Apa yang ingin Anda bagikan?' : 'What do you want to share?'}</label>
                <textarea
                  id="story-content-input"
                  className="input-field w-full px-3 py-2 text-xs resize-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
                  rows={4}
                  maxLength={120}
                  placeholder={language === 'id' ? 'Tulis kutipan favorit atau progres membaca hari ini (maks 120 karakter)...' : 'Write your favorite quote or reading progress today (max 120 characters)...'}
                  value={storyContent}
                  onChange={(e) => setStoryContent(e.target.value)}
                  required
                />
                <span className="text-[10px] text-text-slate-light text-right block mt-1">
                  {storyContent.length}/120 {language === 'id' ? 'karakter' : 'characters'}
                </span>
              </div>

              <div>
                <label htmlFor="story-book-select" className="block text-xs font-semibold text-text-slate-medium mb-1.5">{language === 'id' ? 'Hubungkan ke Buku (Opsional)' : 'Connect to Book (Optional)'}</label>
                <select
                  id="story-book-select"
                  className="input-field w-full px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-brand-orange/40"
                  value={storyBookTitle}
                  onChange={(e) => setStoryBookTitle(e.target.value)}
                >
                  <option value="">{language === 'id' ? 'Pilih Buku...' : 'Select Book...'}</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.title}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border-light-gray mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateStory(false);
                    setStoryContent('');
                    setStoryBookTitle('');
                  }}
                  className="btn-secondary active-pop"
                >
                  {translations[language].cancel}
                </button>
                <button
                  type="submit"
                  className="btn-primary active-pop"
                  disabled={!storyContent.trim()}
                >
                  {language === 'id' ? 'Bagikan' : 'Share'}
                </button>
              </div>
            </form>
          </div>
      </Modal>

      {/* ============ DELETE CONFIRMATION MODAL ============ */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteConfirmPostId)}
        onClose={() => setDeleteConfirmPostId(null)}
        onConfirm={() => {
          if (deleteConfirmPostId) {
            deletePost(deleteConfirmPostId);
            setDeleteConfirmPostId(null);
          }
        }}
        title={translations[language].deleteActivityTitle}
        description={translations[language].deleteActivityConfirm}
        cancelLabel={translations[language].cancel}
        confirmLabel={translations[language].delete}
      />

    </div>
  );
};
