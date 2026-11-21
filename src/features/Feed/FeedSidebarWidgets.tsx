"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { Card } from '../../components/Card';
import { BookCover, UserAvatar } from '../../components/Media';
import { computePercent } from '../../lib/idAndMath';
import { translations } from '../../lib/i18n';
import type { Book, ReadingProgress, User } from '../../types';

interface FriendRecommendation {
  book: Book;
  friend: User;
  status: ReadingProgress['status'];
  updatedAt: string;
}

interface FeedSidebarWidgetsProps {
  language: 'id' | 'en';
  currentUser: User;
  users: User[];
  books: Book[];
  readingProgress: ReadingProgress[];
  currentlyReadingBooks: Book[];
  currentlyReadingProgress: ReadingProgress[];
  userGoal: { targetBooks: number; completedBooksCount: number };
  currentYear: number;
  activeLogBookId: string | null;
  logPage: number;
  setActiveLogBookId: (id: string | null) => void;
  setLogPage: (page: number) => void;
  handleQuickLogProgress: (bookId: string) => void;
  viewBookDetails: (book: Book) => void;
  setCurrentTab: (tab: string) => void;
  setViewedUser: (user: User | null) => void;
}

export const FeedSidebarWidgets: React.FC<FeedSidebarWidgetsProps> = ({
  language,
  currentUser,
  users,
  books,
  readingProgress,
  currentlyReadingBooks,
  currentlyReadingProgress,
  userGoal,
  currentYear,
  activeLogBookId,
  logPage,
  setActiveLogBookId,
  setLogPage,
  handleQuickLogProgress,
  viewBookDetails,
  setCurrentTab,
  setViewedUser,
}) => {
  const friendsProgress = readingProgress.filter(
    (p) => p.userId !== currentUser.id && (p.status === 'READING' || p.status === 'COMPLETED')
  );
  const friendRecommendations = friendsProgress
    .reduce<FriendRecommendation[]>((acc, progressItem) => {
      const book = books.find((b) => b.id === progressItem.bookId);
      const friend = users.find((u) => u.id === progressItem.userId);
      if (book && friend && !acc.some((item) => item.book.id === book.id)) {
        acc.push({
          book,
          friend,
          status: progressItem.status,
          updatedAt: progressItem.updatedAt,
        });
      }
      return acc;
    }, [])
    .slice(0, 3);

  return (
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
                        type="button"
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
          <button
            type="button"
            onClick={() => setCurrentTab('books')}
            className="hover:underline cursor-pointer bg-transparent border-none p-0 text-[10px] text-text-slate-medium"
          >
            {translations[language].viewAll}
          </button>{' '}
          •{' '}
          <button
            type="button"
            className="hover:underline cursor-pointer bg-transparent border-none p-0 text-[10px] text-text-slate-medium"
            onClick={() => setCurrentTab('books')}
          >
            {translations[language].addBook}
          </button>
        </div>
      </Card>

      {/* WIDGET 2: RECOMMENDATION FROM BOOKMATES */}
      <Card hoverable={false} className="p-4">
        <h3 className="text-xs font-bold text-text-slate-dark mb-4 border-b border-border-light-gray pb-2">
          {translations[language].recomBookmates}
        </h3>

        {friendRecommendations.length === 0 ? (
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
        ) : (
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
                    <UserAvatar
                      src={item.friend.avatar}
                      alt={item.friend.displayName}
                      width={14}
                      height={14}
                      className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                    />
                    <span className="text-[9px] font-bold text-text-slate-light leading-none">
                      {item.status === 'COMPLETED' ? 'Selesai dibaca oleh ' : 'Sedang dibaca oleh '}
                      <span className="text-text-slate-medium">{item.friend.displayName}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* WIDGET 3: READING CHALLENGE */}
      <Card hoverable={false} className="p-4">
        <h3 className="text-xs font-bold text-text-slate-dark mb-4 border-b border-border-light-gray pb-2">
          {language === 'id' ? 'Tantangan Membaca' : 'Reading Challenge'} {currentYear}
        </h3>

        <div className="flex gap-4 items-center">
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

            <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-brand-orange"
                style={{
                  width: `${computePercent(userGoal.completedBooksCount, userGoal.targetBooks)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-text-slate-light">
              <span>
                {userGoal.completedBooksCount} {language === 'id' ? 'dari' : 'of'} {userGoal.targetBooks}
              </span>
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
  );
};
