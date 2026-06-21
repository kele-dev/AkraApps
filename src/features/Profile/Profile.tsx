"use client";

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { BookOpen, CheckCircle, Flame, FileText, ArrowLeft } from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentUser, viewedUser, setViewedUser, setCurrentTab, posts, books, readingProgress, goals } = useApp();

  const targetUser = viewedUser || currentUser;
  const isOwnProfile = targetUser.id === currentUser.id;

  // Filter progress for target user
  const userProgress = readingProgress.filter((p) => p.userId === targetUser.id);
  const readingBooks = books.filter((b) => 
    userProgress.some((p) => p.bookId === b.id && p.status === 'READING')
  );
  const completedBooks = books.filter((b) => 
    userProgress.some((p) => p.bookId === b.id && p.status === 'COMPLETED')
  );

  // Calculate statistics
  const currentYear = new Date().getFullYear();
  const userGoal = goals.find((g) => g.userId === targetUser.id && g.year === currentYear) || {
    targetBooks: 12,
    completedBooksCount: 0
  };

  const totalPagesRead = userProgress.reduce((sum, p) => {
    // If completed, add total pages. Else add current page
    const book = books.find((b) => b.id === p.bookId);
    if (!book) return sum;
    return sum + (p.status === 'COMPLETED' ? book.totalPages : p.currentPage);
  }, 0);

  // Filter target user's posts
  const userPosts = posts.filter((p) => p.userId === targetUser.id);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* Back Button for Other User Profiles */}
      {!isOwnProfile && (
        <button
          onClick={() => {
            setViewedUser(null);
            setCurrentTab('feed');
          }}
          className="flex items-center gap-2 self-start text-xs font-extrabold text-text-slate-dark hover:text-brand-orange cursor-pointer transition-colors border border-border-light-gray bg-white py-2.5 px-5 rounded-full shadow-xs hover:shadow-sm hover:border-brand-orange/30 transition-all animate-slide-in"
        >
          <ArrowLeft size={14} className="text-brand-orange" />
          Kembali ke Home Feed
        </button>
      )}
      
      {/* Profile Header */}
      <Card hoverable={false} className="flex gap-6 items-center flex-wrap p-5">
        <img
          src={targetUser.avatar}
          alt={targetUser.displayName}
          className="w-[90px] h-[90px] rounded-full object-cover border-3 border-brand-orange shadow-md"
        />
        <div className="flex-1 min-w-[240px]">
          <h2 className="text-2xl font-extrabold text-text-slate-dark mb-0.5">
            {targetUser.displayName}
          </h2>
          <p className="text-text-slate-medium text-xs mb-3">
            @{targetUser.username}
          </p>
          <p className="text-text-slate-medium text-sm leading-relaxed">
            {targetUser.bio}
          </p>
        </div>
      </Card>

      {/* Grid Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Buku Dibaca', value: readingBooks.length + completedBooks.length, icon: BookOpen, color: 'text-brand-green' },
          { label: 'Selesai Dibaca', value: completedBooks.length, icon: CheckCircle, color: 'text-brand-orange' },
          { label: 'Halaman Dibaca', value: totalPagesRead, icon: FileText, color: 'text-purple-600' },
          { label: 'Target Tahun Ini', value: `${completedBooks.length}/${userGoal.targetBooks}`, icon: Flame, color: 'text-rose-500' }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} hoverable={false} className="p-5 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-text-slate-medium font-semibold">
                <span>{stat.label}</span>
                <Icon size={16} className={stat.color} />
              </div>
              <span className="text-2xl font-extrabold text-text-slate-dark">
                {stat.value}
              </span>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Active Readings */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-text-slate-dark mb-1">Sedang Dibaca ({readingBooks.length})</h3>
          
          {readingBooks.length === 0 ? (
            <Card hoverable={false} className="text-text-slate-light text-center p-8 text-sm">
              {isOwnProfile ? 'Belum ada buku yang sedang dibaca saat ini.' : `${targetUser.displayName} belum membaca buku baru baru-baru ini.`}
            </Card>
          ) : (
            readingBooks.map((book) => {
              const progress = userProgress.find((p) => p.bookId === book.id);
              const currentPage = progress ? progress.currentPage : 0;
              return (
                <Card key={book.id} hoverable={false} className="flex gap-4 p-4">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-12 h-16 object-cover rounded-md border border-border-light-gray"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-text-slate-dark truncate mb-0.5">
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-text-slate-medium truncate">{book.author}</p>
                    </div>
                    <ProgressBar value={currentPage} max={book.totalPages} showText={false} />
                    <span className="text-[10px] text-text-slate-light mt-1 block">
                      Hal {currentPage} / {book.totalPages}
                    </span>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Right Column: User's Recent Activities/Posts */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-text-slate-dark mb-1">
            {isOwnProfile ? 'Aktivitas Saya' : `Aktivitas ${targetUser.displayName}`} ({userPosts.length})
          </h3>

          {userPosts.length === 0 ? (
            <Card hoverable={false} className="text-text-slate-light text-center p-8 text-sm">
              {isOwnProfile ? 'Anda belum membagikan kiriman apapun di Feed.' : `${targetUser.displayName} belum membagikan kiriman apapun.`}
            </Card>
          ) : (
            userPosts.map((post) => (
              <Card key={post.id} hoverable={false} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                    post.type === 'QUOTE' ? 'bg-purple-100 text-purple-600' : post.type === 'THOUGHT' ? 'bg-brand-orange-glow text-brand-orange' : 'bg-brand-green-glow text-brand-green'
                  }`}>
                    {post.type === 'QUOTE' ? 'Kutipan' : post.type === 'THOUGHT' ? 'Ulasan' : 'Progres'}
                  </span>
                  
                  <span className="text-[10px] text-text-slate-light">
                    {new Date(post.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                
                {post.bookTitle && (
                  <p className="text-xs text-text-slate-medium">
                    Buku: <strong className="font-bold">{post.bookTitle}</strong>
                  </p>
                )}

                <p className={`text-xs text-text-slate-dark leading-relaxed ${
                  post.type === 'QUOTE' ? 'font-serif italic border-l-2 border-brand-orange pl-2.5' : ''
                }`}>
                  {post.content}
                </p>
              </Card>
            ))
          )}
        </div>

      </div>

    </div>
  );
};
