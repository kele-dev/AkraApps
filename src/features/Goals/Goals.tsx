"use client";

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/Card';
import { Trophy, Edit2, Check, Award, BookOpen } from 'lucide-react';

export const Goals: React.FC = () => {
  const { goals, currentUser, books, readingProgress, setGoal } = useApp();

  const currentYear = new Date().getFullYear();
  const userGoal = goals.find((g) => g.userId === currentUser.id && g.year === currentYear) || {
    userId: currentUser.id,
    year: currentYear,
    targetBooks: 12,
    completedBooksCount: 0,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [newTarget, setNewTarget] = useState(userGoal.targetBooks);

  const handleSaveGoal = () => {
    if (newTarget > 0) {
      setGoal(newTarget);
      setIsEditing(false);
    }
  };

  // Find completed books for the current user
  const completedProgressList = readingProgress.filter(
    (p) => p.userId === currentUser.id && p.status === 'COMPLETED'
  );
  
  const completedBooks = books.filter((book) =>
    completedProgressList.some((progress) => progress.bookId === book.id)
  );

  const remainingBooks = Math.max(0, userGoal.targetBooks - completedBooks.length);
  const completionPercentage = Math.round((completedBooks.length / userGoal.targetBooks) * 100) || 0;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-text-slate-dark mb-1">
          Target Membaca {currentYear}
        </h2>
        <p className="text-text-slate-medium text-sm">
          Set target tahunan Anda untuk menumbuhkan kebiasaan membaca yang disiplin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Main Goal Tracker Card */}
        <Card hoverable={false} className="flex flex-col justify-between min-h-[260px] p-5">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2.5">
                <Trophy className="text-brand-orange" size={24} />
                <h3 className="text-sm font-bold text-text-slate-dark">Pencapaian Buku</h3>
              </div>
              
              {isEditing ? (
                <button 
                  onClick={handleSaveGoal}
                  className="bg-transparent border-none text-brand-orange cursor-pointer flex items-center gap-1 font-bold text-sm"
                >
                  <Check size={16} /> Simpan
                </button>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-transparent border-none text-text-slate-medium cursor-pointer flex items-center gap-1 text-xs hover:text-text-slate-dark"
                >
                  <Edit2 size={12} /> Ubah Target
                </button>
              )}
            </div>

            {/* Editing UI */}
            {isEditing ? (
              <div className="mb-6">
                <label className="block text-xs font-semibold text-text-slate-medium mb-2">
                  Atur Target Jumlah Buku Setahun:
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={newTarget}
                    onChange={(e) => setNewTarget(parseInt(e.target.value) || 12)}
                    className="flex-1 accent-brand-orange"
                  />
                  <span className="text-base font-extrabold text-text-slate-dark min-w-[40px] text-right">
                    {newTarget}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-extrabold text-text-slate-dark leading-none">
                  {completedBooks.length}
                </span>
                <span className="text-xs text-text-slate-medium">
                  dari {userGoal.targetBooks} Buku Selesai
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between text-xs text-text-slate-medium mb-2">
              <span>Progres Target</span>
              <span className="font-bold text-brand-orange">{completionPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-orange transition-all duration-300" 
                style={{ width: `${completionPercentage}%` }} 
              />
            </div>
          </div>

        </Card>

        {/* Motivational Card */}
        <Card hoverable={false} className="bg-linear-to-br from-brand-orange/5 to-purple-500/5 border border-border-light-gray p-5">
          <div className="flex flex-col gap-4 h-full justify-center items-center text-center p-3">
            <Award size={40} className="text-brand-orange" />
            <div>
              <h4 className="text-sm font-bold text-text-slate-dark mb-2">
                {remainingBooks === 0 
                  ? 'Selamat! Target Membaca Tercapai! 🎉' 
                  : `Tersisa ${remainingBooks} Buku Lagi!`}
              </h4>
              <p className="text-xs text-text-slate-medium leading-relaxed max-w-[300px]">
                {remainingBooks === 0 
                  ? 'Luar biasa! Anda telah menuntaskan misi membaca tahun ini. Anda bisa menaikkan target untuk tantangan ekstra!' 
                  : 'Setiap lembar halaman membawa Anda lebih dekat pada pemikiran konseptual yang dalam. Tetap konsisten!'}
              </p>
            </div>
          </div>
        </Card>

      </div>

      {/* Completed Books Shelf */}
      <div>
        <h3 className="text-sm font-bold text-text-slate-dark mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-brand-orange" />
          Buku yang Diselesaikan Tahun Ini
        </h3>

        {completedBooks.length === 0 ? (
          <Card hoverable={false} className="text-center p-10 text-text-slate-light text-sm">
            Belum ada buku yang selesai dibaca tahun ini. Mulai perbarui progres membaca Anda di halaman Perpustakaan!
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {completedBooks.map((book) => (
              <Card key={book.id} hoverable={false} className="flex gap-4 p-4 items-center">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-12 h-16 object-cover rounded-md border border-border-light-gray"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-text-slate-dark truncate">
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-text-slate-medium">
                    {book.author}
                  </p>
                  <span className="text-[10px] text-brand-orange font-bold block mt-1">
                    ✓ Selesai
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
