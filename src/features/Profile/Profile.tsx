"use client";

import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { BookOpen, CheckCircle, Flame, FileText, ArrowLeft } from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80'
];

export const Profile: React.FC = () => {
  const { currentUser, viewedUser, setViewedUser, setCurrentTab, posts, books, readingProgress, goals, updateProfile } = useApp();

  const targetUser = viewedUser || currentUser;
  const isOwnProfile = targetUser.id === currentUser.id;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const openEditModal = () => {
    setEditName(currentUser.displayName);
    setEditUsername(currentUser.username);
    setEditBio(currentUser.bio || '');
    setEditWebsite(currentUser.website || '');
    setEditGender(currentUser.gender || 'Pilih tidak menyebutkan');
    setEditAvatar(currentUser.avatar);
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
    });
    setIsEditing(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar terlalu besar. Maksimal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setEditAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };


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
          <div className="flex items-center gap-4 flex-wrap mb-2">
            <h2 className="text-2xl font-extrabold text-text-slate-dark leading-none">
              {targetUser.displayName}
            </h2>
            {isOwnProfile && (
              <button
                onClick={openEditModal}
                className="btn-secondary py-1 px-4 text-xs rounded-md font-bold cursor-pointer"
              >
                Edit Profil
              </button>
            )}
          </div>
          <p className="text-text-slate-medium text-xs mb-3">
            @{targetUser.username}
          </p>
          <p className="text-text-slate-medium text-sm leading-relaxed mb-2.5">
            {targetUser.bio}
          </p>
          {(targetUser.website || targetUser.gender) && (
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {targetUser.website && (
                <a
                  href={targetUser.website.startsWith('http') ? targetUser.website : `https://${targetUser.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-brand-orange hover:underline flex items-center gap-1"
                >
                  <span>🔗</span> {targetUser.website}
                </a>
              )}
              {targetUser.gender && (
                <span className="text-[10px] bg-bg-light-gray border border-border-light-gray text-text-slate-medium px-2 py-0.5 rounded-md font-medium">
                  {targetUser.gender}
                </span>
              )}
            </div>
          )}
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

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-in">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-light-gray bg-bg-light-gray">
              <h3 className="text-base font-bold text-text-slate-dark">Edit Profil</h3>
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-text-slate-medium hover:text-text-slate-dark bg-transparent border-none text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[85vh]">
              {/* Photo Profile Section */}
              <div className="flex flex-col items-center gap-2.5 pb-4 border-b border-border-light-gray">
                <div 
                  className="relative group cursor-pointer w-20 h-20"
                  onClick={() => fileInputRef.current?.click()}
                  title="Klik untuk unggah foto baru"
                >
                  <img
                    src={editAvatar}
                    alt="Avatar Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-brand-orange shadow-md group-hover:opacity-85 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-[10px] font-bold">Ubah Foto</span>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-1.5 w-full">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-transparent border-none text-xs font-bold text-brand-orange cursor-pointer hover:text-brand-orange-hover"
                  >
                    Ubah Foto Profil (Unggah File)
                  </button>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-text-slate-medium font-semibold">Pilihan Avatar:</span>
                    <div className="flex gap-1.5">
                      {PRESET_AVATARS.map((av, idx) => (
                        <img
                          key={idx}
                          src={av}
                          alt={`Preset ${idx + 1}`}
                          onClick={() => setEditAvatar(av)}
                          className={`w-7 h-7 rounded-full object-cover cursor-pointer border transition-all hover:scale-105 ${
                            editAvatar === av ? 'border-brand-orange scale-105 ring-2 ring-brand-orange/30' : 'border-border-light-gray'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="w-full max-w-[280px] mt-2 flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-text-slate-medium self-start">Atau gunakan URL foto:</label>
                    <input
                      type="text"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="URL Foto Profil"
                      className="input-field text-[10px] px-2.5 py-1.5 rounded-md w-full focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="flex flex-col gap-4">
                {/* Nama */}
                <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] items-start gap-2">
                  <label className="text-xs font-semibold text-text-slate-medium pt-2 sm:text-right sm:pr-4">Nama</label>
                  <div>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="input-field w-full px-3 py-2 rounded-md text-xs focus:outline-none"
                      placeholder="Nama Lengkap"
                    />
                    <p className="text-[9px] text-text-slate-light mt-1">Bantuan orang lain menemukan akun Anda dengan menggunakan nama yang Anda kenal.</p>
                  </div>
                </div>

                {/* Nama Pengguna */}
                <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] items-start gap-2">
                  <label className="text-xs font-semibold text-text-slate-medium pt-2 sm:text-right sm:pr-4">Username</label>
                  <div>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      required
                      className="input-field w-full px-3 py-2 rounded-md text-xs focus:outline-none"
                      placeholder="Username"
                    />
                  </div>
                </div>

                {/* Situs Web */}
                <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] items-start gap-2">
                  <label className="text-xs font-semibold text-text-slate-medium pt-2 sm:text-right sm:pr-4">Situs Web</label>
                  <div>
                    <input
                      type="text"
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      className="input-field w-full px-3 py-2 rounded-md text-xs focus:outline-none"
                      placeholder="https://situs-web-anda.com"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] items-start gap-2">
                  <label className="text-xs font-semibold text-text-slate-medium pt-2 sm:text-right sm:pr-4">Bio</label>
                  <div>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={3}
                      className="input-field w-full px-3 py-2 rounded-md text-xs focus:outline-none resize-none"
                      placeholder="Tulis bio singkat Anda..."
                    />
                  </div>
                </div>

                {/* Jenis Kelamin */}
                <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] items-start gap-2">
                  <label className="text-xs font-semibold text-text-slate-medium pt-2 sm:text-right sm:pr-4">Jenis Kelamin</label>
                  <div>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="input-field w-full px-3 py-2 rounded-md text-xs focus:outline-none"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                      <option value="Pilih tidak menyebutkan">Pilih tidak menyebutkan</option>
                      <option value="Kustom">Kustom</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-border-light-gray mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary py-1.5 px-4 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary py-1.5 px-4 text-xs font-bold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
