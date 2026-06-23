"use client";

import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { Feed } from '../features/Feed/Feed';
import { Books } from '../features/Books/Books';
import { Goals } from '../features/Goals/Goals';
import { Profile } from '../features/Profile/Profile';
import { SearchPage } from '../features/Search/Search';

export default function Home() {
  const { currentTab } = useApp();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1140px] mx-auto px-5 py-8">
        {currentTab === 'feed' && <Feed />}
        {currentTab === 'books' && <Books />}
        {currentTab === 'goals' && <Goals />}
        {currentTab === 'profile' && <Profile />}
        {currentTab === 'search' && <SearchPage />}
      </main>
    </div>
  );
}
