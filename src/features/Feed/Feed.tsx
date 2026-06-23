"use client";

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/Card';
import { MessageSquare, Bookmark, Quote, BookOpen, Send, Star, ChevronDown, Check } from 'lucide-react';

export const Feed: React.FC = () => {
  const { posts, currentUser, books, readingProgress, addPost, likePost, addComment, updateProgress, goals, setViewedUser, setCurrentTab, users } = useApp();
  
  // Tabs for Feed layout link switching
  const [postType, setPostType] = useState<'QUOTE' | 'THOUGHT'>('QUOTE');
  const [content, setContent] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  
  // Comment State (per post)
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

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
    if (!content.trim()) return;

    addPost(postType, content, selectedBookId || undefined);
    setContent('');
    setSelectedBookId('');
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) {
      return diffMins <= 1 ? 'Baru saja' : `${diffMins}m lalu`;
    } else if (diffHours < 24) {
      return `${diffHours}j lalu`;
    } else {
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }
  };

  // Find Currently Reading books
  const userProgress = readingProgress.filter((p) => p.userId === currentUser.id);
  const currentlyReadingProgress = userProgress.filter((p) => p.status === 'READING');
  const currentlyReadingBooks = books.filter((b) => 
    currentlyReadingProgress.some((p) => p.bookId === b.id)
  );

  // Recommendations (Mock)
  const recommendedBook = books.find((b) => b.id === 'b4') || books[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2.2fr_1fr] gap-8 items-start animate-fade-in">
      
      {/* ================= LEFT COLUMN: FEED & UPDATES ================= */}
      <div className="flex flex-col gap-6">
        
        {/* Share thoughts container */}
        <Card hoverable={false} className="p-4">
          <form onSubmit={handlePostSubmit} className="flex flex-col gap-3">
            <div className="flex gap-4 border-b border-border-light-gray pb-2.5">
              <button
                type="button"
                onClick={() => setPostType('QUOTE')}
                className={`bg-transparent border-none font-bold text-xs cursor-pointer flex items-center gap-1.5 pb-1.5 border-b-2 transition-all ${
                  postType === 'QUOTE' ? 'color-brand-orange border-brand-orange' : 'text-text-slate-medium border-transparent'
                }`}
              >
                <Quote size={14} />
                Bagikan Kutipan
              </button>
              <button
                type="button"
                onClick={() => setPostType('THOUGHT')}
                className={`bg-transparent border-none font-bold text-xs cursor-pointer flex items-center gap-1.5 pb-1.5 border-b-2 transition-all ${
                  postType === 'THOUGHT' ? 'color-brand-orange border-brand-orange' : 'text-text-slate-medium border-transparent'
                }`}
              >
                <MessageSquare size={14} />
                Bagikan Ulasan
              </button>
            </div>

            <textarea
              className="w-full bg-white text-text-slate-dark text-sm p-1 resize-vertical min-h-[60px] focus:outline-none"
              rows={2}
              placeholder={
                postType === 'QUOTE'
                  ? 'Bagikan kutipan inspiratif dari buku yang Anda baca...'
                  : 'Tulis ulasan ringkas atau pemikiran Anda di sini...'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />

            <div className="flex flex-wrap gap-3 justify-between items-center border-t border-border-light-gray pt-2.5">
              <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                <Bookmark size={16} className="text-text-slate-light" />
                <select
                  className="w-full bg-bg-light-gray text-text-slate-dark text-xs p-1.5 rounded-md border border-transparent focus:outline-none"
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                >
                  <option value="">Hubungkan dengan Buku</option>
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
                disabled={!content.trim()}
              >
                Posting
              </button>
            </div>
          </form>
        </Card>

        {/* Updates list header */}
        <div className="flex justify-between border-b border-border-light-gray pb-2">
          <h3 className="text-sm font-bold text-text-slate-dark">Updates</h3>
          <span className="text-xs text-text-slate-medium cursor-pointer hover:underline">Customize</span>
        </div>

        {/* Feed Posts */}
        {posts.map((post) => {
          const isLiked = post.likes.includes(currentUser.id);
          const postBook = books.find((b) => b.id === post.bookId);
          
          return (
            <Card key={post.id} hoverable={false} className="p-6 flex flex-col gap-4">
              
              {/* Header: User Profile, Activity, Time */}
              <div className="flex gap-3 items-start">
                <img
                  src={post.userAvatar}
                  alt={post.userDisplayName}
                  onClick={() => handleUserClick(post.userId, post.userDisplayName, post.userAvatar)}
                  className="w-9 h-9 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                />
                <div className="flex-1">
                  <div className="text-sm text-text-slate-dark leading-relaxed">
                    <strong 
                      onClick={() => handleUserClick(post.userId, post.userDisplayName, post.userAvatar)}
                      className="font-bold cursor-pointer hover:text-brand-orange hover:underline transition-all"
                    >
                      {post.userDisplayName}
                    </strong>{' '}
                    {post.type === 'PROGRESS_UPDATE' ? (
                      post.currentPage && post.totalPages && post.currentPage === post.totalPages ? (
                        <span>menyelesaikan membaca <strong className="font-semibold">{post.bookTitle}</strong></span>
                      ) : (
                        <span>memperbarui progres di <strong className="font-semibold">{post.bookTitle}</strong></span>
                      )
                    ) : post.type === 'QUOTE' ? (
                      <span>membagikan kutipan dari <strong className="font-semibold">{post.bookTitle}</strong></span>
                    ) : (
                      <span>menulis ulasan untuk <strong className="font-semibold">{post.bookTitle}</strong></span>
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
                    hal {post.currentPage} dari {post.totalPages}
                  </span>
                </div>
              )}

              {/* Connected Book Detail Box */}
              {postBook && (
                <div className="flex gap-4 p-4 rounded-md bg-[#fafbfc] border border-border-light-gray">
                  <img
                    src={postBook.coverImage}
                    alt={postBook.title}
                    className="w-15 h-20 object-cover rounded-md border border-border-light-gray"
                  />
                  <div className="flex-1 flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-text-slate-dark leading-snug">
                      {postBook.title}
                    </h4>
                    <p className="text-xs text-text-slate-medium">
                      oleh {postBook.author}
                    </p>
                    <p className="text-xs text-text-slate-light line-clamp-2 leading-relaxed">
                      {post.type === 'THOUGHT' || post.type === 'QUOTE' ? post.content : `Melacak perjalanan membaca bersama komunitas AKRA.`}
                    </p>
                  </div>
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
              <div className="flex items-center justify-between border-t border-border-light-gray pt-3 text-xs">
                <div className="flex gap-4">
                  <button
                    onClick={() => likePost(post.id)}
                    className={`bg-transparent border-none font-semibold cursor-pointer flex items-center gap-1 transition-colors ${
                      isLiked ? 'text-brand-orange' : 'text-text-slate-medium hover:text-brand-orange'
                    }`}
                  >
                    Like
                  </button>
                  <button className="bg-transparent border-none font-semibold text-text-slate-medium hover:text-text-slate-dark cursor-pointer">
                    Comment
                  </button>
                </div>

                {/* Rating Display */}
                <div className="flex items-center gap-2">
                  <span className="text-text-slate-light text-[10px]">Rate it:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={14} className="text-gray-200 fill-gray-200 cursor-pointer hover:fill-brand-orange" />
                    ))}
                  </div>
                </div>

                {/* Want to Read button */}
                <div className="flex">
                  <button className="bg-[#403020] text-white rounded-l border-none px-3 py-1.5 text-[10px] font-extrabold hover:bg-[#504030] cursor-pointer flex items-center gap-1.5">
                    Want to Read
                  </button>
                  <button className="bg-[#403020] text-white rounded-r border-none border-l border-white/20 px-1.5 py-1.5 text-[10px] hover:bg-[#504030] cursor-pointer flex items-center justify-center">
                    <ChevronDown size={10} />
                  </button>
                </div>
              </div>

              {/* Nested Comments & Input */}
              <div className="flex flex-col gap-2.5 bg-[#fafbfc] p-3 rounded-md border border-border-light-gray">
                {/* Existing comments */}
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 items-start text-xs">
                    <img
                      src={comment.avatar}
                      alt={comment.displayName}
                      onClick={() => handleUserClick(comment.userId, comment.displayName, comment.avatar)}
                      className="w-6 h-6 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    />
                    <div className="flex-1">
                      <div>
                        <strong 
                          onClick={() => handleUserClick(comment.userId, comment.displayName, comment.avatar)}
                          className="font-bold text-text-slate-dark mr-1 cursor-pointer hover:text-brand-orange hover:underline transition-all"
                        >
                          {comment.displayName}
                        </strong>{' '}
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
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.displayName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      className="input-field w-full pr-9 text-xs bg-white border border-border-light-gray rounded-md h-8 focus:outline-none focus:border-brand-orange transition-all"
                      placeholder="Tulis komentar..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommentSubmit(post.id);
                      }}
                    />
                    <button
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
            Sedang Dibaca
          </h3>
          
          {currentlyReadingBooks.length === 0 ? (
            <p className="text-xs text-text-slate-light my-3">
              Belum ada buku aktif. Silakan pilih buku dari perpustakaan.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {currentlyReadingBooks.map((book) => {
                const progress = currentlyReadingProgress.find((p) => p.bookId === book.id);
                const currentPage = progress ? progress.currentPage : 0;
                
                return (
                  <div key={book.id} className="flex gap-3 items-start">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-11 h-16 object-cover rounded-md border border-border-light-gray"
                    />
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <h4 className="text-xs font-bold text-text-slate-dark truncate">
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-text-slate-medium truncate">
                        oleh {book.author}
                      </p>
                      
                      {activeLogBookId === book.id ? (
                        <div className="flex gap-1.5 items-center mt-1">
                          <input
                            type="number"
                            value={logPage}
                            onChange={(e) => setLogPage(parseInt(e.target.value) || 0)}
                            className="w-11 text-xs p-1 border border-border-light-gray rounded-md bg-white text-center focus:outline-none"
                          />
                          <span className="text-[10px] text-text-slate-light">/ {book.totalPages}</span>
                          <button 
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
                          Update Progress
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-border-light-gray mt-4 pt-2 flex gap-2 text-[10px] text-text-slate-medium">
            <span className="hover:underline cursor-pointer">Lihat Semua</span> • <span className="hover:underline cursor-pointer">Tambah Buku</span>
          </div>
        </Card>

        {/* WIDGET 2: RECOMMENDATION */}
        <Card hoverable={false} className="p-4">
          <h3 className="text-xs font-bold text-text-slate-dark mb-4 border-b border-border-light-gray pb-2">
            Rekomendasi
          </h3>

          <div className="flex gap-3 items-start">
            <img
              src={recommendedBook.coverImage}
              alt={recommendedBook.title}
              className="w-12 h-17 object-cover rounded-md border border-border-light-gray"
            />
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <h4 className="text-xs font-bold text-text-slate-dark truncate">
                {recommendedBook.title}
              </h4>
              <p className="text-[11px] text-text-slate-medium">
                oleh {recommendedBook.author}
              </p>
              
              <div className="flex gap-0.5 items-center mt-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={11} className="fill-brand-orange text-brand-orange" />
                ))}
                <span className="text-[10px] text-text-slate-medium ml-1 font-bold">4.68</span>
              </div>

              <button className="btn-primary self-start py-0.5 px-3 rounded-full text-[10px] mt-1.5">
                Want to Read
              </button>
            </div>
          </div>
        </Card>

        {/* WIDGET 3: READING CHALLENGE */}
        <Card hoverable={false} className="p-4">
          <h3 className="text-xs font-bold text-text-slate-dark mb-4 border-b border-border-light-gray pb-2">
            Tantangan Membaca {currentYear}
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
                buku selesai dibaca
              </div>

              {/* Mini progress bar */}
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-1">
                <div 
                  className="h-full bg-brand-orange" 
                  style={{ 
                    width: `${Math.min(100, Math.round((userGoal.completedBooksCount / userGoal.targetBooks) * 100))}%` 
                  }} 
                />
              </div>
              <div className="flex justify-between text-[9px] text-text-slate-light">
                <span>{userGoal.completedBooksCount} dari {userGoal.targetBooks}</span>
              </div>
            </div>
          </div>

          <button className="btn-secondary w-full justify-center py-1 px-3 rounded-full text-xs mt-4">
            Lihat Target
          </button>
        </Card>

      </div>

    </div>
  );
};
