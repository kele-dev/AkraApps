"use client";

import React, { useState, useRef, useEffect } from 'react';
import { UserAvatar } from '../../components/Media';
import { computePercent } from '../../lib/idAndMath';
import type { Book, BuddyMessage, BuddyRead, ReadingProgress, User } from '../../types';
import type { RichBookDetail } from './bookDetailsData';

interface BuddyReadSectionProps {
  selectedBook: Book;
  libraryBook: Book | null | undefined;
  richDetail: RichBookDetail;
  currentUser: User;
  users: User[];
  readingProgress: ReadingProgress[];
  buddyReads: BuddyRead[];
  buddyMessages: BuddyMessage[];
  language: 'id' | 'en';
  addBook: (
    title: string,
    author: string,
    totalPages: number,
    category: string,
    coverImage?: string
  ) => Book | undefined;
  startBuddyRead: (bookId: string, buddyUserId: string) => void;
  addBuddyMessage: (buddyReadId: string, content: string) => void;
}

export const BuddyReadSection: React.FC<BuddyReadSectionProps> = ({
  selectedBook,
  libraryBook,
  richDetail,
  currentUser,
  users,
  readingProgress,
  buddyReads,
  buddyMessages,
  language,
  addBook,
  startBuddyRead,
  addBuddyMessage,
}) => {
  const [buddyMessageText, setBuddyMessageText] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [buddyMessages]);

  const bookIdForBuddy = libraryBook?.id || selectedBook.id;
  const activeBuddyRead = buddyReads.find(
    (br) => br.bookId === bookIdForBuddy && br.userIds.includes(currentUser.id)
  );

  return (
    <div className="border-t border-border-light-gray/60 pt-6 mt-8">
      <h3 className="text-sm font-extrabold text-text-slate-dark uppercase tracking-wider flex items-center gap-2">
        <span>👥</span> Membaca Bersama Teman (Buddy Read)
      </h3>

      {activeBuddyRead ? (
        (() => {
          const buddyUserId = activeBuddyRead.userIds.find((id) => id !== currentUser.id);
          const buddyUser = users.find((u) => u.id === buddyUserId);

          const myProgress = readingProgress.find(
            (p) => p.userId === currentUser.id && p.bookId === bookIdForBuddy
          );
          const myPage = myProgress ? myProgress.currentPage : 0;
          const myPercent = computePercent(myPage, selectedBook.totalPages);

          const buddyProgress = readingProgress.find(
            (p) => p.userId === buddyUserId && p.bookId === bookIdForBuddy
          );
          const buddyPage = buddyProgress ? buddyProgress.currentPage : 0;
          const buddyPercent = computePercent(buddyPage, selectedBook.totalPages);

          const messages = buddyMessages.filter((m) => m.buddyReadId === activeBuddyRead.id);

          return (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 bg-gray-50/50 border border-border-light-gray/40 rounded-2xl p-4 mt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold text-text-slate-medium">
                      <span className="flex items-center gap-1.5">
                        <UserAvatar
                          src={currentUser.avatar}
                          alt={currentUser.displayName}
                          width={16}
                          height={16}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>Anda</span>
                      </span>
                      <span className="text-brand-orange">
                        {myPage} / {selectedBook.totalPages} hal ({myPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/20">
                      <div
                        className="h-full bg-brand-orange transition-all duration-300 rounded-full"
                        style={{ width: `${myPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold text-text-slate-medium">
                      <span className="flex items-center gap-1.5">
                        <UserAvatar
                          src={buddyUser?.avatar}
                          alt={buddyUser?.displayName || 'Buddy'}
                          width={16}
                          height={16}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>{buddyUser?.displayName}</span>
                      </span>
                      <span className="text-[#348055]">
                        {buddyPage} / {selectedBook.totalPages} hal ({buddyPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/20">
                      <div
                        className="h-full bg-[#348055] transition-all duration-300 rounded-full"
                        style={{ width: `${buddyPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col border border-border-light-gray rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="bg-bg-light-gray px-4 py-2 border-b border-border-light-gray flex items-center justify-between">
                  <span className="text-xs font-extrabold text-text-slate-dark">
                    Papan Obrolan Diskusi Privat
                  </span>
                  <span className="text-[10px] bg-brand-orange-glow border border-brand-orange/20 text-brand-orange px-2 py-0.5 rounded-full font-bold">
                    Bebas Spoiler
                  </span>
                </div>

                <div
                  className="p-4 flex flex-col gap-3 max-h-60 overflow-y-auto bg-slate-50/10"
                  ref={chatContainerRef}
                >
                  {messages.length === 0 ? (
                    <p className="text-center text-[11px] text-text-slate-light py-6 italic font-medium">
                      Belum ada obrolan. Mulai diskusi Anda di sini!
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.userId === currentUser.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 items-start ${isMe ? 'flex-row-reverse' : ''}`}
                        >
                          <UserAvatar
                            src={msg.userAvatar}
                            alt={msg.userDisplayName}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-border-light-gray"
                          />
                          <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : ''}`}>
                            <span className="text-[9px] font-bold text-text-slate-light mb-0.5">
                              {msg.userDisplayName}
                            </span>
                            <div
                              className={`p-2.5 rounded-2xl text-xs leading-relaxed ${
                                isMe
                                  ? 'bg-brand-orange text-white rounded-tr-none'
                                  : 'bg-white border border-border-light-gray text-text-slate-dark rounded-tl-none shadow-xs'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!buddyMessageText.trim()) return;
                    addBuddyMessage(activeBuddyRead.id, buddyMessageText);
                    setBuddyMessageText('');
                  }}
                  className="flex border-t border-border-light-gray p-2 gap-2 bg-gray-50/50"
                >
                  <input
                    type="text"
                    aria-label={language === 'id' ? 'Pesan diskusi Buddy Read' : 'Buddy Read chat message'}
                    placeholder="Tulis pesan diskusi di sini..."
                    value={buddyMessageText}
                    onChange={(e) => setBuddyMessageText(e.target.value)}
                    className="flex-1 input-field py-1.5 px-3 text-xs bg-white rounded-lg h-9 focus-visible:ring-2 focus-visible:ring-brand-orange/40"
                  />
                  <button
                    type="submit"
                    className="btn-primary py-1.5 px-4 rounded-lg text-xs font-bold shrink-0 h-9"
                  >
                    Kirim
                  </button>
                </form>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="bg-gray-50/50 border border-border-light-gray/40 rounded-2xl p-5 mt-3 flex flex-col gap-3">
          <p className="text-xs text-text-slate-medium leading-relaxed">
            Ingin membaca buku ini bersama teman? Undang mereka untuk membaca bersama, memantau
            kemajuan membaca satu sama lain secara riil, dan berdiskusi di ruang chat privat tanpa
            takut spoiler!
          </p>
          <div className="flex gap-3 flex-wrap mt-1">
            {users
              .filter((u) => u.id !== currentUser.id)
              .map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    let targetBookId = libraryBook?.id;
                    if (!libraryBook) {
                      const newBook = addBook(
                        richDetail.title,
                        richDetail.author,
                        richDetail.totalPages,
                        richDetail.category,
                        richDetail.coverImage
                      );
                      targetBookId = newBook?.id;
                    }
                    if (targetBookId) {
                      startBuddyRead(targetBookId, u.id);
                    }
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-text-slate-dark border border-border-light-gray bg-white py-2 px-4 rounded-full shadow-2xs hover:shadow-xs hover:border-brand-orange/30 transition-all cursor-pointer active-pop hover-scale"
                >
                  <UserAvatar
                    src={u.avatar}
                    alt={u.displayName}
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>Undang {u.displayName}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
