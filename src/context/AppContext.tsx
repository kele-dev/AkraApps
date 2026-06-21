"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Book, ReadingProgress, Post, ReadingGoal, Comment } from '../types';
import { auth, db, isDemoMode, simulateGoogleSignIn, signInWithGoogleReal } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';

interface AppContextProps {
  currentUser: User;
  users: User[];
  books: Book[];
  readingProgress: ReadingProgress[];
  posts: Post[];
  goals: ReadingGoal[];
  isLoggedIn: boolean;
  viewedUser: User | null;
  setViewedUser: (user: User | null) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProgress: (bookId: string, page: number, status: ReadingProgress['status']) => void;
  addPost: (type: 'QUOTE' | 'THOUGHT' | 'PROGRESS_UPDATE', content: string, bookId?: string, page?: number) => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, commentContent: string) => void;
  setGoal: (targetBooks: number) => void;
  addBook: (title: string, author: string, totalPages: number, category: string) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Guest User Default
const GUEST_USER: User = {
  id: 'guest',
  username: 'guest',
  displayName: 'Pengunjung',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  bio: 'Silakan masuk dengan Google untuk menyimpan data membaca.'
};

// INITIAL MOCK DATA
const INITIAL_USERS: User[] = [
  { id: 'g_user_bagus', username: 'bagus', displayName: 'Bagus', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80', bio: 'Membaca untuk bertumbuh. Menyenangi filsafat dan pengembangan diri.' },
  { id: '2', username: 'rachel', displayName: 'Rachel Amanda', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80', bio: 'Bibliophile, pecinta kopi, dan pengulas buku fiksi.' },
  { id: '3', username: 'dimas', displayName: 'Dimas Aditya', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80', bio: 'Suka buku sejarah, sains populer, dan fiksi ilmiah.' }
];

const INITIAL_BOOKS: Book[] = [
  { id: 'b1', title: 'Filosofi Teras', author: 'Henry Manampiring', coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80', totalPages: 320, category: 'Filsafat' },
  { id: 'b2', title: 'Atomic Habits', author: 'James Clear', coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=300&q=80', totalPages: 320, category: 'Self-Improvement' },
  { id: 'b3', title: 'Sapiens: Riwayat Singkat Umat Manusia', author: 'Yuval Noah Harari', coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=300&q=80', totalPages: 520, category: 'Sejarah' },
  { id: 'b4', title: 'Bumi', author: 'Tere Liye', coverImage: 'https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?auto=format&fit=crop&w=300&q=80', totalPages: 440, category: 'Fiksi' }
];

// Rich reading progress mock database for all users
const INITIAL_PROGRESS = (userId: string): ReadingProgress[] => {
  const baseProgress = [
    // Bagus
    { id: 'p1_1', userId: 'g_user_bagus', bookId: 'b1', currentPage: 120, status: 'READING' as const, updatedAt: new Date().toISOString() },
    { id: 'p2_1', userId: 'g_user_bagus', bookId: 'b2', currentPage: 320, status: 'COMPLETED' as const, updatedAt: new Date().toISOString() },
    
    // Rachel
    { id: 'p3_2', userId: '2', bookId: 'b2', currentPage: 150, status: 'READING' as const, updatedAt: new Date().toISOString() },
    { id: 'p4_2', userId: '2', bookId: 'b1', currentPage: 320, status: 'COMPLETED' as const, updatedAt: new Date().toISOString() },
    { id: 'p5_2', userId: '2', bookId: 'b3', currentPage: 520, status: 'COMPLETED' as const, updatedAt: new Date().toISOString() },
    { id: 'p6_2', userId: '2', bookId: 'b4', currentPage: 440, status: 'COMPLETED' as const, updatedAt: new Date().toISOString() },
    
    // Dimas
    { id: 'p7_3', userId: '3', bookId: 'b3', currentPage: 410, status: 'READING' as const, updatedAt: new Date().toISOString() },
    { id: 'p8_3', userId: '3', bookId: 'b1', currentPage: 320, status: 'COMPLETED' as const, updatedAt: new Date().toISOString() },
    { id: 'p9_3', userId: '3', bookId: 'b2', currentPage: 120, status: 'READING' as const, updatedAt: new Date().toISOString() }
  ];
  return baseProgress;
};

const INITIAL_POSTS = (userId: string, userDisplayName: string, userAvatar: string): Post[] => [
  {
    id: 'post1',
    userId: '2',
    userDisplayName: 'Rachel Amanda',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    type: 'QUOTE',
    bookId: 'b1',
    bookTitle: 'Filosofi Teras',
    content: '"Kita tidak bisa mengendalikan hal eksternal (tindakan orang lain, kemacetan, cuaca), kita hanya bisa mengendalikan respon kita terhadapnya. Di situlah letak kebebasan dan kebahagiaan kita."',
    likes: [userId, '3'],
    comments: [
      { id: 'c1', userId, displayName: userDisplayName, avatar: userAvatar, content: 'Kutipan favorit saya juga! Sangat membantu meredakan overthinking.', createdAt: new Date().toISOString() }
    ],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'post2',
    userId: '3',
    userDisplayName: 'Dimas Aditya',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
    type: 'THOUGHT',
    bookId: 'b3',
    bookTitle: 'Sapiens: Riwayat Singkat Umat Manusia',
    content: 'Menarik memikirkan bagaimana "fiksi bersama" seperti uang, hukum, dan negara bisa menyatukan jutaan orang asing untuk bekerja sama. Harari menjelaskan ini dengan sangat brilian di bab-bab awal.',
    likes: ['2'],
    comments: [],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

const INITIAL_GOALS = (userId: string): ReadingGoal[] => [
  { userId: 'g_user_bagus', year: new Date().getFullYear(), targetBooks: 12, completedBooksCount: 1 },
  { userId: '2', year: new Date().getFullYear(), targetBooks: 24, completedBooksCount: 4 },
  { userId: '3', year: new Date().getFullYear(), targetBooks: 10, completedBooksCount: 2 }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Browsing Profiles state
  const [viewedUser, setViewedUser] = useState<User | null>(null);

  // Routing state
  const [currentTab, setCurrentTab] = useState<string>('feed');

  // Core App states
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [goals, setGoals] = useState<ReadingGoal[]>([]);

  // 1. Listen to Real Firebase Auth (if not demo mode)
  useEffect(() => {
    if (isDemoMode) {
      // Load user session from LocalStorage
      const savedUser = localStorage.getItem('akra_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setIsLoggedIn(true);
      }
      setIsLoaded(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const loggedUser: User = {
          id: firebaseUser.uid,
          username: firebaseUser.email?.split('@')[0] || 'user',
          displayName: firebaseUser.displayName || 'Google User',
          avatar: firebaseUser.photoURL || GUEST_USER.avatar,
          bio: 'Pengguna terverifikasi Google.'
        };
        setCurrentUser(loggedUser);
        setIsLoggedIn(true);
        await syncDataFromFirestore(firebaseUser.uid, loggedUser);
      } else {
        setCurrentUser(GUEST_USER);
        setIsLoggedIn(false);
        setReadingProgress([]);
        setPosts([]);
        setGoals([]);
      }
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  // 2. Load User Specific LocalStorage Data (Demo Mode & Fallback)
  useEffect(() => {
    if (!isLoaded || currentUser.id === 'guest') return;

    if (isDemoMode) {
      const prefix = `akra_${currentUser.id}_`;
      const savedBooks = localStorage.getItem(`${prefix}books`);
      const savedProgress = localStorage.getItem(`${prefix}progress`);
      const savedPosts = localStorage.getItem(`${prefix}posts`);
      const savedGoals = localStorage.getItem(`${prefix}goals`);

      if (savedBooks) {
        setBooks(JSON.parse(savedBooks));
      } else {
        setBooks(INITIAL_BOOKS);
      }

      if (savedProgress) {
        setReadingProgress(JSON.parse(savedProgress));
      } else {
        setReadingProgress(INITIAL_PROGRESS(currentUser.id));
      }

      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      } else {
        setPosts(INITIAL_POSTS(currentUser.id, currentUser.displayName, currentUser.avatar));
      }

      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      } else {
        setGoals(INITIAL_GOALS(currentUser.id));
      }
    }
  }, [currentUser, isLoaded]);

  // 3. Save User Specific Data when state changes (Demo Mode & Fallback)
  useEffect(() => {
    if (!isLoaded || currentUser.id === 'guest') return;

    if (isDemoMode) {
      const prefix = `akra_${currentUser.id}_`;
      localStorage.setItem(`${prefix}books`, JSON.stringify(books));
      localStorage.setItem(`${prefix}progress`, JSON.stringify(readingProgress));
      localStorage.setItem(`${prefix}posts`, JSON.stringify(posts));
      localStorage.setItem(`${prefix}goals`, JSON.stringify(goals));
    } else {
      // Real Firebase Firestore Sync
      syncDataToFirestore();
    }
  }, [books, readingProgress, posts, goals, currentUser, isLoaded]);

  // Sync from Firestore
  const syncDataFromFirestore = async (userId: string, userObj: User) => {
    try {
      // Query Progress
      const progressQuery = query(collection(db, 'progress'));
      const progressSnap = await getDocs(progressQuery);
      const progressList: ReadingProgress[] = [];
      progressSnap.forEach((doc) => {
        progressList.push(doc.data() as ReadingProgress);
      });
      setReadingProgress(progressList.length > 0 ? progressList : INITIAL_PROGRESS(userId));

      // Query Goals
      const goalsQuery = query(collection(db, 'goals'));
      const goalsSnap = await getDocs(goalsQuery);
      const goalsList: ReadingGoal[] = [];
      goalsSnap.forEach((doc) => {
        goalsList.push(doc.data() as ReadingGoal);
      });
      setGoals(goalsList.length > 0 ? goalsList : INITIAL_GOALS(userId));

      // Query Posts
      const postsQuery = query(collection(db, 'posts'));
      const postsSnap = await getDocs(postsQuery);
      const postsList: Post[] = [];
      postsSnap.forEach((doc) => {
        postsList.push(doc.data() as Post);
      });
      setPosts(postsList.length > 0 ? postsList : INITIAL_POSTS(userId, userObj.displayName, userObj.avatar));
    } catch (e) {
      console.error("Gagal sinkronisasi data masuk dari Firestore:", e);
    }
  };

  // Sync to Firestore
  const syncDataToFirestore = async () => {
    if (isDemoMode || currentUser.id === 'guest') return;
    try {
      // Sync Progress
      for (const p of readingProgress) {
        await setDoc(doc(db, 'progress', p.id), p);
      }
      // Sync Goals
      for (const g of goals) {
        await setDoc(doc(db, 'goals', `${g.userId}_${g.year}`), g);
      }
      // Sync Posts
      for (const post of posts) {
        await setDoc(doc(db, 'posts', post.id), post);
      }
    } catch (e) {
      console.error("Gagal sinkronisasi data keluar ke Firestore:", e);
    }
  };

  // Autentikasi Actions
  const loginWithGoogle = async () => {
    if (isDemoMode) {
      const mockUser = await simulateGoogleSignIn();
      const loggedUser: User = {
        id: mockUser.uid,
        username: mockUser.email.split('@')[0],
        displayName: mockUser.displayName,
        avatar: mockUser.photoURL,
        bio: 'Pengguna Google (Simulasi Demo).'
      };
      setCurrentUser(loggedUser);
      setIsLoggedIn(true);
      localStorage.setItem('akra_current_user', JSON.stringify(loggedUser));
    } else {
      try {
        await signInWithGoogleReal();
      } catch (err) {
        console.error("Gagal Login Google riil:", err);
      }
    }
  };

  const logout = async () => {
    if (isDemoMode) {
      setCurrentUser(GUEST_USER);
      setIsLoggedIn(false);
      localStorage.removeItem('akra_current_user');
      setViewedUser(null);
      setReadingProgress([]);
      setPosts([]);
      setGoals([]);
    } else {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Gagal Logout riil:", err);
      }
    }
  };

  // Actions
  const updateProgress = (bookId: string, page: number, status: ReadingProgress['status']) => {
    if (currentUser.id === 'guest') return;

    setReadingProgress((prev) => {
      const existingIdx = prev.findIndex((p) => p.userId === currentUser.id && p.bookId === bookId);
      const book = books.find((b) => b.id === bookId);
      const limitPage = book ? book.totalPages : page;
      const checkedPage = Math.min(page, limitPage);
      const finalStatus = checkedPage === limitPage ? 'COMPLETED' : status;

      let newProgress = [...prev];
      if (existingIdx > -1) {
        newProgress[existingIdx] = {
          ...newProgress[existingIdx],
          currentPage: checkedPage,
          status: finalStatus,
          updatedAt: new Date().toISOString(),
        };
      } else {
        newProgress.push({
          id: `p_${Date.now()}`,
          userId: currentUser.id,
          bookId,
          currentPage: checkedPage,
          status: finalStatus,
          updatedAt: new Date().toISOString(),
        });
      }

      // If completed, update goals count
      if (finalStatus === 'COMPLETED' && (existingIdx === -1 || prev[existingIdx].status !== 'COMPLETED')) {
        updateGoalCompletedCount(1);
      }

      return newProgress;
    });

    // Automatically create a post for progress update or completion
    const targetBook = books.find((b) => b.id === bookId);
    if (targetBook) {
      const displayStatus = page >= targetBook.totalPages 
        ? `Telah menyelesaikan membaca buku "${targetBook.title}"! 🎉` 
        : `Mencapai halaman ${page} dari ${targetBook.totalPages} untuk buku "${targetBook.title}"`;
      
      addPost(
        'PROGRESS_UPDATE',
        displayStatus,
        bookId,
        page
      );
    }
  };

  const updateGoalCompletedCount = (increment: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.userId === currentUser.id && g.year === new Date().getFullYear()) {
          return {
            ...g,
            completedBooksCount: g.completedBooksCount + increment,
          };
        }
        return g;
      })
    );
  };

  const addPost = (type: 'QUOTE' | 'THOUGHT' | 'PROGRESS_UPDATE', content: string, bookId?: string, page?: number) => {
    if (currentUser.id === 'guest') return;

    const book = books.find((b) => b.id === bookId);
    const newPost: Post = {
      id: `post_${Date.now()}`,
      userId: currentUser.id,
      userDisplayName: currentUser.displayName,
      userAvatar: currentUser.avatar,
      type,
      bookId,
      bookTitle: book?.title,
      content,
      currentPage: page,
      totalPages: book?.totalPages,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) => [newPost, ...prev]);
  };

  const likePost = (postId: string) => {
    if (currentUser.id === 'guest') return;

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isLiked = post.likes.includes(currentUser.id);
          const newLikes = isLiked
            ? post.likes.filter((id) => id !== currentUser.id)
            : [...post.likes, currentUser.id];
          return { ...post, likes: newLikes };
        }
        return post;
      })
    );
  };

  const addComment = (postId: string, commentContent: string) => {
    if (currentUser.id === 'guest') return;
    if (!commentContent.trim()) return;

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      userId: currentUser.id,
      displayName: currentUser.displayName,
      avatar: currentUser.avatar,
      content: commentContent,
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newComment],
          };
        }
        return post;
      })
    );
  };

  const setGoal = (targetBooks: number) => {
    if (currentUser.id === 'guest') return;

    const currentYear = new Date().getFullYear();
    setGoals((prev) => {
      const existingIdx = prev.findIndex((g) => g.userId === currentUser.id && g.year === currentYear);
      let newGoals = [...prev];
      if (existingIdx > -1) {
        newGoals[existingIdx] = {
          ...newGoals[existingIdx],
          targetBooks,
        };
      } else {
        newGoals.push({
          userId: currentUser.id,
          year: currentYear,
          targetBooks,
          completedBooksCount: 0,
        });
      }
      return newGoals;
    });
  };

  const addBook = (title: string, author: string, totalPages: number, category: string) => {
    if (currentUser.id === 'guest') return;

    const newBook: Book = {
      id: `b_${Date.now()}`,
      title,
      author,
      coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80',
      totalPages,
      category,
    };
    setBooks((prev) => [...prev, newBook]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        books,
        readingProgress,
        posts,
        goals,
        isLoggedIn,
        viewedUser,
        setViewedUser,
        currentTab,
        setCurrentTab,
        loginWithGoogle,
        logout,
        updateProgress,
        addPost,
        likePost,
        addComment,
        setGoal,
        addBook,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
