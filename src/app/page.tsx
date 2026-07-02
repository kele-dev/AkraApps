"use client";

import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { Feed } from '../features/Feed/Feed';
import { Books } from '../features/Books/Books';
import { Profile } from '../features/Profile/Profile';
import { SearchPage } from '../features/Search/Search';
import { BookDetails } from '../features/Books/BookDetails';
import { Login } from '../components/Login';
import { BottomNav } from '../components/BottomNav';
import { AnimatedBook } from '../components/AnimatedBook';

export default function Home() {
  const { currentTab, isLoggedIn, isLoaded } = useApp();

  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#faf8f5] via-[#f3ede4] to-[#e6dcd0]">
        <AnimatedBook size="lg" className="mb-4" />
        <div className="mt-2 text-xs font-semibold text-text-slate-medium animate-pulse tracking-wide">
          Memuat AKRA...
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1140px] mx-auto px-5 pt-6 pb-24 md:py-8">
        {currentTab === 'feed' && <Feed />}
        {currentTab === 'books' && <Books />}
        {currentTab === 'profile' && <Profile />}
        {currentTab === 'search' && <SearchPage />}
        {currentTab === 'book-details' && <BookDetails />}
      </main>

      {/* Bottom Nav Bar for Mobile */}
      <BottomNav />
    </div>
  );
}

