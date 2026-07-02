"use client";

import React from 'react';
import { useApp } from '../context/AppContext';
import { Home as HomeIcon, BookOpen } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, setViewedUser, currentUser, language } = useApp();

  const tabs = [
    { id: 'feed', label: language === 'id' ? 'Beranda' : 'Home', icon: HomeIcon },
    { id: 'books', label: language === 'id' ? 'Perpustakaan' : 'Library', icon: BookOpen },
    { id: 'profile', label: language === 'id' ? 'Profil Saya' : 'My Profile', icon: null } // Handled with avatar below
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-border-light-gray flex justify-around items-center z-50 md:hidden px-4 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id || (tab.id === 'books' && currentTab === 'book-details');
        
        return (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'profile') {
                setViewedUser(null); // Reset profile view to self
              }
              setCurrentTab(tab.id);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 bg-transparent border-none cursor-pointer flex-1 py-1 transition-all active-pop ${
              isActive ? 'text-brand-orange' : 'text-text-slate-medium hover:text-text-slate-dark'
            }`}
          >
            {tab.id === 'profile' ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.displayName}
                className={`w-6 h-6 rounded-full object-cover border transition-all ${
                  isActive ? 'border-brand-orange ring-2 ring-brand-orange/15 scale-105' : 'border-border-light-gray hover:border-text-slate-light'
                }`}
              />
            ) : (
              Icon && <Icon size={20} className={isActive ? 'animate-pop' : ''} />
            )}
            <span className="text-[10px] font-bold tracking-tight">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
