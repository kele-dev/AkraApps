"use client";

import React from 'react';
import { BookOpen } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { UserAvatar } from '../../components/Media';
import type { Story } from '../../types';

interface StoryViewerModalProps {
  activeStoryUserId: string | null;
  activeUserStories: Story[];
  activeStoryIndex: number;
  language: 'id' | 'en';
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  activeStoryUserId,
  activeUserStories,
  activeStoryIndex,
  language,
  onClose,
  onPrev,
  onNext,
}) => (
  <Modal
    isOpen={Boolean(activeStoryUserId && activeUserStories.length > 0)}
    onClose={onClose}
    ariaLabel={language === 'id' ? 'Penampil cerita' : 'Story viewer'}
    backdropClassName="bg-black/90"
  >
    {activeStoryUserId && activeUserStories.length > 0 && (
      <div className="relative w-full max-w-[380px] h-[70vh] md:h-[75vh] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-b from-[#3a2212] to-[#120a05] flex flex-col justify-between text-white p-5 animate-slide-in">
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
              onClick={onClose}
              className="bg-transparent border-none text-white/70 hover:text-white cursor-pointer text-xl p-1 active-pop"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 text-center gap-6">
          {activeUserStories[activeStoryIndex].bookTitle && (
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-2 px-3.5 rounded-full flex items-center gap-2 max-w-[280px] shadow-sm">
              <BookOpen size={14} className="text-brand-orange shrink-0" />
              <span className="text-[10px] text-white/90 text-left font-semibold truncate">
                Membaca: {activeUserStories[activeStoryIndex].bookTitle}
              </span>
            </div>
          )}

          <p className="font-serif italic text-base leading-relaxed text-white/95 whitespace-pre-line px-2">
            &quot;{activeUserStories[activeStoryIndex].content}&quot;
          </p>
        </div>

        <div className="flex justify-between items-center px-1 text-xs text-white/50 border-t border-white/10 pt-3">
          <button
            type="button"
            disabled={activeStoryIndex === 0}
            onClick={onPrev}
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
            onClick={onNext}
            className="bg-white/10 hover:bg-white/20 text-white rounded px-3 py-1.5 border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active-pop"
          >
            Berikutnya
          </button>
        </div>
      </div>
    )}
  </Modal>
);
