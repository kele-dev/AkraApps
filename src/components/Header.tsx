"use client";

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, MessageSquare, Users, Search, LogOut, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, isLoggedIn, loginWithGoogle, logout, currentTab, setCurrentTab, setViewedUser } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);

  const navLinks = [
    { id: 'feed', label: 'Home Feed' },
    { id: 'books', label: 'Perpustakaan' },
    { id: 'goals', label: 'Target Baca' },
    { id: 'profile', label: 'Profil Saya' }
  ];

  return (
    <header className="bg-white border-b border-border-light-gray sticky top-0 z-50 h-14 flex justify-center items-center w-full">
      <div className="w-full max-w-[1140px] px-5 flex items-center justify-between h-full">
        
        {/* Left Section: Logo & Nav Links */}
        <div className="flex items-center gap-7">
          {/* Logo */}
          <div 
            onClick={() => {
              setCurrentTab('feed');
              setViewedUser(null);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-white font-extrabold text-lg">
              a
            </div>
            <span className="text-xl font-extrabold text-brand-orange tracking-tight select-none">
              akra
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex gap-4">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setCurrentTab(link.id);
                  setViewedUser(null); // Reset profile viewing when switching tabs
                }}
                className={`background-transparent border-none text-sm cursor-pointer py-1 px-1 border-b-2 transition-all ${
                  currentTab === link.id 
                    ? 'text-text-slate-dark font-bold border-brand-orange' 
                    : 'text-text-slate-medium font-medium border-transparent hover:text-text-slate-dark'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Center Section: Search Bar */}
        <div className="flex-1 max-w-[320px] mx-6 relative">
          <Search 
            size={16} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-slate-light" 
          />
          <input
            type="text"
            className="input-field w-full pl-9 rounded-full h-8.5 text-xs bg-gray-100 border border-transparent py-1.5 focus:outline-none focus:border-brand-orange focus:bg-white transition-all"
            placeholder="Cari buku, kutipan, atau teman..."
          />
        </div>

        {/* Right Section: Notification Icons / Login / Profile Dropdown */}
        <div className="flex items-center gap-4 relative">
          {isLoggedIn ? (
            <>
              {/* Logged In Utilities */}
              <button className="bg-transparent border-none cursor-pointer text-text-slate-medium p-1.5 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <Bell size={20} className="text-brand-orange" />
              </button>
              
              <button className="bg-transparent border-none cursor-pointer text-text-slate-medium p-1.5 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <MessageSquare size={20} className="text-brand-orange" />
              </button>
              
              <button className="bg-transparent border-none cursor-pointer text-text-slate-medium p-1.5 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <Users size={20} className="text-brand-orange" />
              </button>

              {/* User Profile Avatar with Click Dropdown */}
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-8 h-8 rounded-full object-cover cursor-pointer border border-border-light-gray hover:border-brand-orange transition-all"
                />

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2.5 w-56 bg-white border border-border-light-gray rounded-lg shadow-md p-2 flex flex-col gap-1 z-50">
                    <div className="px-3 py-2 border-b border-border-light-gray mb-1">
                      <p className="text-xs font-bold text-text-slate-dark truncate">{currentUser.displayName}</p>
                      <p className="text-[10px] text-text-slate-light truncate">@{currentUser.username}</p>
                    </div>

                    <button
                      onClick={() => {
                        setViewedUser(null);
                        setCurrentTab('profile');
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold text-text-slate-medium rounded-md hover:bg-gray-100 hover:text-text-slate-dark transition-all cursor-pointer border-none bg-transparent"
                    >
                      <User size={14} className="text-text-slate-light" />
                      Profil Saya
                    </button>

                    <button
                      onClick={async () => {
                        setShowDropdown(false);
                        await logout();
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold text-red-600 rounded-md hover:bg-red-50 transition-all cursor-pointer border-none bg-transparent"
                    >
                      <LogOut size={14} className="text-red-500" />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Logged Out Guest Button */
            <button 
              onClick={loginWithGoogle}
              className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-4 rounded-full font-bold cursor-pointer"
            >
              Masuk dengan Google
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
