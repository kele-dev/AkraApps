"use client";

import React from 'react';
import { BookOpen, Heart, MessageSquare, Quote, Trash2 } from 'lucide-react';
import { translations } from '../../lib/i18n';
import { formatRelativeTime } from '../../lib/dateUtils';
import type { Post, User } from '../../types';

interface ProfileActivityTabsProps {
  mainTab: 'bookshelf' | 'updates' | 'quotes';
  language: 'id' | 'en';
  currentUser: User;
  userPosts: Post[];
  userQuotes: Post[];
  activeCommentPostId: string | null;
  profileCommentText: string;
  setActiveCommentPostId: (id: string | null) => void;
  setProfileCommentText: (val: string) => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  setDeleteConfirmPostId: (postId: string | null) => void;
}

export const ProfileActivityTabs: React.FC<ProfileActivityTabsProps> = ({
  mainTab,
  language,
  currentUser,
  userPosts,
  userQuotes,
  activeCommentPostId,
  profileCommentText,
  setActiveCommentPostId,
  setProfileCommentText,
  likePost,
  addComment,
  setDeleteConfirmPostId,
}) => {
  const relativeTime = (dateStr: string) => formatRelativeTime(dateStr, language);

  if (mainTab === 'updates') {
    return (
      <div className="p-4 flex flex-col gap-4">
        {userPosts.length === 0 ? (
          <div className="text-center py-16 text-text-slate-light">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">{translations[language].noActivity}</p>
            <p className="text-xs mt-1">{translations[language].startActivityDesc}</p>
          </div>
        ) : (
          userPosts.map((post) => {
            const isLiked = post.likes.includes(currentUser.id);
            const typeLabel = {
              QUOTE: { icon: '💬', label: language === 'id' ? 'Kutipan' : 'Quote' },
              THOUGHT: { icon: '💭', label: language === 'id' ? 'Pemikiran' : 'Thought' },
              PROGRESS_UPDATE: { icon: '📖', label: language === 'id' ? 'Update Baca' : 'Reading Update' },
              PHOTO: { icon: '📷', label: language === 'id' ? 'Foto' : 'Photo' },
            }[post.type];

            return (
              <div
                key={post.id}
                className="border border-border-light-gray rounded-xl p-4 bg-white hover:border-slate-200 hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{typeLabel.icon}</span>
                  <span className="text-[10px] font-bold text-text-slate-light uppercase tracking-wide">
                    {typeLabel.label}
                  </span>
                  {post.bookTitle && (
                    <>
                      <span className="text-[10px] text-text-slate-light">·</span>
                      <span className="text-[10px] font-bold text-brand-orange truncate max-w-[150px]">
                        {post.bookTitle}
                      </span>
                    </>
                  )}
                  <span className="ml-auto text-[10px] text-text-slate-light shrink-0">
                    {relativeTime(post.createdAt)}
                  </span>
                </div>

                {post.type === 'QUOTE' ? (
                  <blockquote className="border-l-2 border-brand-orange pl-3 italic text-sm text-text-slate-dark leading-relaxed">
                    {post.content}
                  </blockquote>
                ) : (
                  <p className="text-sm text-text-slate-dark leading-relaxed">{post.content}</p>
                )}

                {post.type === 'PROGRESS_UPDATE' && post.currentPage && post.totalPages && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-orange rounded-full"
                        style={{ width: `${Math.round((post.currentPage / post.totalPages) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-slate-medium font-bold shrink-0">
                      {post.currentPage}/{post.totalPages} hal
                    </span>
                  </div>
                )}

                {post.rating && post.rating > 0 && (
                  <div className="flex gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={`text-sm ${s <= post.rating! ? 'text-amber-400' : 'text-gray-200'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-light-gray/60">
                  <button
                    type="button"
                    onClick={() => likePost(post.id)}
                    className={`flex items-center gap-1.5 text-[11px] font-bold bg-transparent border-none cursor-pointer transition-colors ${
                      isLiked ? 'text-red-500' : 'text-text-slate-light hover:text-red-400'
                    }`}
                  >
                    <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                    {post.likes.length > 0 && <span>{post.likes.length}</span>}
                    <span>{translations[language].like}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id);
                      setProfileCommentText('');
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-text-slate-light hover:text-text-slate-medium bg-transparent border-none cursor-pointer transition-colors"
                  >
                    <MessageSquare size={14} />
                    {post.comments.length > 0 && <span>{post.comments.length}</span>}
                    <span>{translations[language].comment}</span>
                  </button>
                  {post.userId === currentUser.id && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmPostId(post.id)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-text-slate-light hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors ml-auto"
                    >
                      <Trash2 size={14} />
                      <span>{translations[language].delete}</span>
                    </button>
                  )}
                </div>

                {activeCommentPostId === post.id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!profileCommentText.trim()) return;
                      addComment(post.id, profileCommentText);
                      setProfileCommentText('');
                      setActiveCommentPostId(null);
                    }}
                    className="flex gap-2 mt-3"
                  >
                    <input
                      type="text"
                      value={profileCommentText}
                      onChange={(e) => setProfileCommentText(e.target.value)}
                      placeholder={translations[language].writeCommentPlaceholder}
                      aria-label={translations[language].writeCommentPlaceholder}
                      className="input-field flex-1 px-3 py-1.5 text-xs"
                    />
                    <button type="submit" className="btn-primary py-1.5 px-3 text-xs">
                      {language === 'id' ? 'Kirim' : 'Send'}
                    </button>
                  </form>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  }

  if (mainTab === 'quotes') {
    return (
      <div className="p-4 flex flex-col gap-4">
        {userQuotes.length === 0 ? (
          <div className="text-center py-16 text-text-slate-light">
            <Quote size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">{translations[language].noQuotes}</p>
            <p className="text-xs mt-1">{translations[language].shareQuoteDesc}</p>
          </div>
        ) : (
          userQuotes.map((post) => {
            const isLiked = post.likes.includes(currentUser.id);
            return (
              <div
                key={post.id}
                className="relative rounded-2xl overflow-hidden border border-amber-100/80 bg-gradient-to-br from-amber-50/60 to-orange-50/30 p-5 hover:shadow-sm transition-all"
              >
                <div className="absolute top-3 left-4 text-5xl text-brand-orange/10 font-serif leading-none select-none pointer-events-none">
                  &quot;
                </div>
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
                  <span className="text-[10px] text-text-slate-light font-semibold">
                    {relativeTime(post.createdAt)}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => likePost(post.id)}
                      className={`flex items-center gap-1 text-[11px] font-bold bg-transparent border-none cursor-pointer transition-colors ${
                        isLiked ? 'text-red-500' : 'text-text-slate-light hover:text-red-400'
                      }`}
                    >
                      <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
                      {post.likes.length > 0 && <span>{post.likes.length}</span>}
                    </button>
                    {post.userId === currentUser.id && (
                      <button
                        type="button"
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
    );
  }

  return null;
};
