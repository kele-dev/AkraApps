"use client";

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen } from 'lucide-react';
import { AnimatedBook } from './AnimatedBook';

export const Login: React.FC = () => {
  const { loginWithGoogle } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center px-4 py-12 relative overflow-hidden select-none bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: "url('/login_bg.png')" }}
    >
      {/* Premium Glassmorphic Overlay for backdrop filtering of the background */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[3px] pointer-events-none" />
      {/* Soft warm gradient vignette to frame the container */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#e6dcd0]/50 via-transparent to-[#faf8f5]/50 pointer-events-none" />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-orange/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-orange/10 blur-[150px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md animate-slide-in relative z-10">
        <div className="glass-card w-full p-8 md:p-10 flex flex-col items-center text-center relative overflow-hidden border border-white/60 bg-white/80 shadow-2xl rounded-3xl">
          
          {/* Logo Area */}
          <div className="flex items-center gap-2 mb-6">
            <AnimatedBook size="md" className="transform hover:scale-105 active-pop cursor-pointer" />
            <span className="text-2xl font-extrabold text-brand-orange tracking-tight select-none">
              akra
            </span>
          </div>

          {/* Bookmate Tagline Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange-glow border border-brand-orange/15 text-[10px] font-bold text-brand-orange uppercase tracking-wider mb-6 animate-pulse">
            <BookOpen size={10} className="shrink-0 animate-bounce" />
            <span>With books comes friends</span>
          </div>

          {/* Main Hero Card Text */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-slate-dark tracking-tight leading-tight mb-4 font-heading">
            Welcome home!<br />
            Ready to meet your bookmates?
          </h1>

          <p className="text-text-slate-medium text-xs md:text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            AKRA adalah ruang akrab untuk berbagi kutipan, mencatat progres membaca, dan terhubung dengan pembaca lain yang sefrekuensi.
          </p>

          {/* Premium Google Button */}
          <div className="w-full mt-2">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-border-light-gray rounded-xl py-3 px-5 text-sm font-bold text-text-slate-dark hover:bg-bg-light-gray hover:border-slate-300 hover:shadow-md active-pop transition-all duration-200 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
              )}
              <span>Masuk dengan Google</span>
            </button>
          </div>

          <div className="mt-6 text-[10px] text-text-slate-light font-medium tracking-wide">
            Aman & Instan • Mode Demo Aktif Otomatis
          </div>

        </div>
      </div>
    </div>
  );
};
