"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Book, ReadingProgress, Post, ReadingGoal, Comment, Story, Shelf, BuddyRead, BuddyMessage, Notification } from '../types';
import { auth, db, isDemoMode, firebaseConfigError, simulateGoogleSignIn, signInWithGoogleReal } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocs, query, where, limit, deleteDoc, writeBatch } from 'firebase/firestore';
import { canDeletePost, filterOwnedRecordsForSync, FIRESTORE_QUERY_LIMITS } from '../lib/firestoreSync';
import { computeProgressTransition } from '../lib/progressUtils';
import { safeStorageGet, safeStorageRemove, safeStorageSet } from '../lib/storage';
import { clampGoalTarget, createUniqueId } from '../lib/idAndMath';

// Helper to recursively clean undefined values for Firestore
const cleanUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  const newObj = { ...obj };
  Object.keys(newObj).forEach((key) => {
    if (newObj[key] === undefined) {
      delete newObj[key];
    } else if (newObj[key] !== null && typeof newObj[key] === 'object') {
      if (Array.isArray(newObj[key])) {
        newObj[key] = newObj[key].map((item: any) => 
          item !== null && typeof item === 'object' ? cleanUndefined(item) : item
        );
      } else {
        newObj[key] = cleanUndefined(newObj[key]);
      }
    }
  });
  return newObj;
};

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
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  selectedBookSuggestion: Book | null;
  setSelectedBookSuggestion: (book: Book | null) => void;
  selectedBook: Book | null;
  setSelectedBook: (book: Book | null) => void;
  previousTab: string;
  setPreviousTab: (tab: string) => void;
  viewBookDetails: (book: Book) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProgress: (bookId: string, page: number, status: ReadingProgress['status'], rating?: number, note?: string) => void;
  addPost: (type: 'QUOTE' | 'THOUGHT' | 'PROGRESS_UPDATE' | 'PHOTO', content: string, bookId?: string, page?: number, rating?: number, imageUrl?: string) => void;
  deletePost: (postId: string) => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, commentContent: string) => void;
  setGoal: (targetBooks: number) => void;
  addBook: (title: string, author: string, totalPages: number, category: string, coverImage?: string) => Book | undefined;
  updateProfile: (updates: Partial<Omit<User, 'id'>>) => void;
  stories: Story[];
  addStory: (content: string, bookTitle?: string) => void;
  savedPostIds: string[];
  toggleSavePost: (postId: string) => void;
  isLoaded: boolean;
  shelves: Shelf[];
  addShelf: (name: string) => void;
  assignBookToShelves: (bookId: string, shelfIds: string[]) => void;
  buddyReads: BuddyRead[];
  buddyMessages: BuddyMessage[];
  startBuddyRead: (bookId: string, buddyUserId: string) => void;
  addBuddyMessage: (buddyReadId: string, content: string) => void;
  notifications: Notification[];
  unreadNotificationCount: number;
  markAllNotificationsRead: () => void;
  followUser: (targetUserId: string) => void;
  isFollowing: (targetUserId: string) => boolean;
  language: 'id' | 'en';
  setLanguage: (lang: 'id' | 'en') => void;
  actionError: string | null;
  clearActionError: () => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
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
const INITIAL_USERS: User[] = [];
const INITIAL_BOOKS: Book[] = [];
const INITIAL_PROGRESS = (userId: string): ReadingProgress[] => [];
const INITIAL_POSTS = (userId: string, userDisplayName: string, userAvatar: string): Post[] => [];
const INITIAL_STORIES = (userId: string): Story[] => [];
const INITIAL_GOALS = (userId: string): ReadingGoal[] => [];
const INITIAL_BUDDY_READS = (userId: string): BuddyRead[] => [];
const INITIAL_NOTIFICATIONS = (currentUserId: string): Notification[] => [];
const getInitialBuddyMessages = (currentUserId: string, currentUserDisplayName: string, currentUserAvatar: string): BuddyMessage[] => [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Merge localStorage users with INITIAL_USERS to include new social fields
  const mergedInitialUsers = INITIAL_USERS.map(initialUser => {
    const parsed = safeStorageGet<Partial<User> | null>(`akra_user_${initialUser.id}`, null);
    return parsed ? { ...initialUser, ...parsed } : initialUser;
  });
  const [users, setUsers] = useState<User[]>(mergedInitialUsers);
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [language, setLanguageState] = useState<'id' | 'en'>('id');
  const [actionError, setActionError] = useState<string | null>(null);
  const clearActionError = () => setActionError(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const clearToast = () => setToast(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load language preference on load
  useEffect(() => {
    try {
      const savedLang = typeof window !== 'undefined' ? localStorage.getItem('akra_language') : null;
      if (savedLang === 'id' || savedLang === 'en') {
        setLanguageState(savedLang);
      }
    } catch {
      // Ignore storage access failures
    }
  }, []);

  const setLanguage = (lang: 'id' | 'en') => {
    setLanguageState(lang);
    try {
      if (typeof window !== 'undefined') localStorage.setItem('akra_language', lang);
    } catch {
      // Ignore storage access failures
    }
  };
  
  // Browsing Profiles state
  const [viewedUser, setViewedUser] = useState<User | null>(null);

  // Routing state
  const [currentTab, setCurrentTab] = useState<string>('feed');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [selectedBookSuggestion, setSelectedBookSuggestion] = useState<Book | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [previousTab, setPreviousTab] = useState<string>('books');

  const viewBookDetails = (book: Book) => {
    setPreviousTab(currentTab === 'book-details' ? previousTab : currentTab);
    setSelectedBook(book);
    setCurrentTab('book-details');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('book', book.id);
      url.searchParams.set('title', book.title);
      url.searchParams.set('author', book.author);
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const sharedBookId = searchParams.get('book');
    if (!sharedBookId) return;
    const matched = books.find((b) => b.id === sharedBookId);
    const sharedBook: Book = matched || {
      id: sharedBookId,
      title: searchParams.get('title') || 'Buku Pilihan',
      author: searchParams.get('author') || 'Penulis',
      coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80',
      totalPages: 200,
    };
    setSelectedBook(sharedBook);
    setCurrentTab('book-details');
  }, [isLoaded]);

  // Core App states
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [buddyReads, setBuddyReads] = useState<BuddyRead[]>([]);
  const [buddyMessages, setBuddyMessages] = useState<BuddyMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 1. Listen to Real Firebase Auth (if not demo mode)
  useEffect(() => {
    if (isDemoMode) {
      // Load user session from LocalStorage safely
      const parsed = safeStorageGet<User | null>('akra_current_user', null);
      if (parsed && typeof parsed === 'object' && parsed.id) {
        const initialMatch = INITIAL_USERS.find(u => u.id === parsed.id);
        const mergedUser = initialMatch ? { ...initialMatch, ...parsed } : parsed;
        setCurrentUser(mergedUser);
        setIsLoggedIn(true);
      }
      setIsLoaded(true);
      return;
    }

    if (!auth) {
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
      const savedBooks = safeStorageGet<Book[]>(`${prefix}books`, INITIAL_BOOKS);
      setBooks(Array.isArray(savedBooks) ? savedBooks : INITIAL_BOOKS);

      const savedProgress = safeStorageGet<ReadingProgress[]>(
        `${prefix}progress`,
        INITIAL_PROGRESS(currentUser.id)
      );
      setReadingProgress(
        Array.isArray(savedProgress)
          ? savedProgress.filter((p) => !p.userId.startsWith('user_'))
          : INITIAL_PROGRESS(currentUser.id)
      );

      const savedPosts = safeStorageGet<Post[]>(
        `${prefix}posts`,
        INITIAL_POSTS(currentUser.id, currentUser.displayName, currentUser.avatar)
      );
      setPosts(
        Array.isArray(savedPosts)
          ? savedPosts.filter(
              (p) =>
                !(
                  p.userId.startsWith('user_') ||
                  ['Rachel Amanda', 'Dimas Aditya', 'Aditya Wibowo', 'Siti Rahma', 'Budi Santoso'].includes(p.userDisplayName) ||
                  p.content.includes("Kita tidak bisa mengendalikan hal eksternal") ||
                  p.content.includes("fiksi bersama")
                )
            )
          : INITIAL_POSTS(currentUser.id, currentUser.displayName, currentUser.avatar)
      );

      const savedGoals = safeStorageGet<ReadingGoal[]>(
        `${prefix}goals`,
        INITIAL_GOALS(currentUser.id)
      );
      setGoals(
        Array.isArray(savedGoals)
          ? savedGoals.filter((g) => !g.userId.startsWith('user_'))
          : INITIAL_GOALS(currentUser.id)
      );

      const savedStories = safeStorageGet<Story[]>(
        `${prefix}stories`,
        INITIAL_STORIES(currentUser.id)
      );
      setStories(
        Array.isArray(savedStories)
          ? savedStories.filter((s) => !s.userId.startsWith('user_'))
          : INITIAL_STORIES(currentUser.id)
      );

      const savedBookmarks = safeStorageGet<string[]>(`${prefix}saved_bookmarks`, []);
      setSavedPostIds(Array.isArray(savedBookmarks) ? savedBookmarks : []);

      const savedShelves = safeStorageGet<Shelf[]>(`${prefix}shelves`, []);
      setShelves(Array.isArray(savedShelves) ? savedShelves : []);

      const savedBuddyReads = safeStorageGet<BuddyRead[]>(
        `${prefix}buddy_reads`,
        INITIAL_BUDDY_READS(currentUser.id)
      );
      setBuddyReads(Array.isArray(savedBuddyReads) ? savedBuddyReads : []);

      const savedBuddyMessages = safeStorageGet<BuddyMessage[]>(
        `${prefix}buddy_messages`,
        getInitialBuddyMessages(currentUser.id, currentUser.displayName, currentUser.avatar)
      );
      setBuddyMessages(Array.isArray(savedBuddyMessages) ? savedBuddyMessages : []);

      const savedNotifications = safeStorageGet<Notification[]>(
        `${prefix}notifications`,
        INITIAL_NOTIFICATIONS(currentUser.id)
      );
      setNotifications(Array.isArray(savedNotifications) ? savedNotifications : []);
    }
  }, [currentUser, isLoaded]);

  // 3. Per-slice LocalStorage persistence (avoids re-serializing all 10 keys on unrelated updates)
  useEffect(() => {
    if (!isLoaded || currentUser.id === 'guest') return;
    safeStorageSet(`akra_${currentUser.id}_books`, books);
  }, [books, currentUser.id, isLoaded]);

  useEffect(() => {
    if (!isLoaded || currentUser.id === 'guest') return;
    safeStorageSet(`akra_${currentUser.id}_progress`, readingProgress);
  }, [readingProgress, currentUser.id, isLoaded]);

  useEffect(() => {
    if (!isLoaded || currentUser.id === 'guest') return;
    safeStorageSet(`akra_${currentUser.id}_posts`, posts);
  }, [posts, currentUser.id, isLoaded]);

  useEffect(() => {
    if (!isLoaded || currentUser.id === 'guest') return;
    safeStorageSet(`akra_${currentUser.id}_goals`, goals);
  }, [goals, currentUser.id, isLoaded]);

  useEffect(() => {
    if (!isLoaded || currentUser.id === 'guest') return;
    safeStorageSet(`akra_${currentUser.id}_stories`, stories);
  }, [stories, currentUser.id, isLoaded]);

  useEffect(() => {
    if (!isLoaded || currentUser.id === 'guest') return;
    safeStorageSet(`akra_${currentUser.id}_saved_bookmarks`, savedPostIds);
  }, [savedPostIds, currentUser.id, isLoaded]);

  useEffect(() => {
    if (!isLoaded || currentUser.id === 'guest') return;
    safeStorageSet(`akra_${currentUser.id}_shelves`, shelves);
  }, [shelves, currentUser.id, isLoaded]);

  useEffect(() => {
    if (!isLoaded || currentUser.id === 'guest') return;
    safeStorageSet(`akra_${currentUser.id}_buddy_reads`, buddyReads);
  }, [buddyReads, currentUser.id, isLoaded]);

  useEffect(() => {
    if (!isLoaded || currentUser.id === 'guest') return;
    safeStorageSet(`akra_${currentUser.id}_buddy_messages`, buddyMessages);
  }, [buddyMessages, currentUser.id, isLoaded]);

  useEffect(() => {
    if (!isLoaded || currentUser.id === 'guest') return;
    safeStorageSet(`akra_${currentUser.id}_notifications`, notifications);
  }, [notifications, currentUser.id, isLoaded]);

  // Debounced Firestore batch sync for synced collections
  useEffect(() => {
    if (!isLoaded || currentUser.id === 'guest' || isDemoMode || !db) return;
    const timer = setTimeout(() => {
      syncDataToFirestore();
    }, 400);
    return () => clearTimeout(timer);
  }, [books, readingProgress, posts, goals, currentUser.id, isLoaded]);

  // Sync from Firestore
  const syncDataFromFirestore = async (userId: string, userObj: User) => {
    try {
      // 1. Fetch Logged In User Profile from Firestore
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      let finalUser = userObj;
      if (userDocSnap.exists()) {
        finalUser = userDocSnap.data() as User;
        setCurrentUser(finalUser);
      } else {
        // First time logging in, save the profile
        await setDoc(userDocRef, cleanUndefined(userObj));
        setCurrentUser(userObj);
      }
      setIsLoggedIn(true);

      const booksQuery = query(collection(db, 'books'), limit(FIRESTORE_QUERY_LIMITS.books));
      const usersQuery = query(collection(db, 'users'), limit(FIRESTORE_QUERY_LIMITS.users));
      const progressQuery = query(collection(db, 'progress'), limit(FIRESTORE_QUERY_LIMITS.progress));
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', userId),
        limit(FIRESTORE_QUERY_LIMITS.goals)
      );
      const postsQuery = query(collection(db, 'posts'), limit(FIRESTORE_QUERY_LIMITS.posts));

      const [booksSnap, usersSnap, progressSnap, goalsSnap, postsSnap] = await Promise.all([
        getDocs(booksQuery),
        getDocs(usersQuery),
        getDocs(progressQuery),
        getDocs(goalsQuery),
        getDocs(postsQuery),
      ]);

      const booksList: Book[] = [];
      booksSnap.forEach((docSnap) => {
        booksList.push(docSnap.data() as Book);
      });
      setBooks(booksList.length > 0 ? booksList : INITIAL_BOOKS);

      const usersList: User[] = [];
      usersSnap.forEach((docSnap) => {
        usersList.push(docSnap.data() as User);
      });
      const existingUserIds = new Set(usersList.map(u => u.id));
      const mergedUsers = [...usersList];
      for (const u of INITIAL_USERS) {
        if (!existingUserIds.has(u.id)) {
          mergedUsers.push(u);
        }
      }
      setUsers(mergedUsers);

      const progressList: ReadingProgress[] = [];
      progressSnap.forEach((docSnap) => {
        progressList.push(docSnap.data() as ReadingProgress);
      });
      setReadingProgress(progressList.length > 0 ? progressList : INITIAL_PROGRESS(userId));

      const goalsList: ReadingGoal[] = [];
      goalsSnap.forEach((docSnap) => {
        goalsList.push(docSnap.data() as ReadingGoal);
      });
      setGoals(goalsList.length > 0 ? goalsList : INITIAL_GOALS(userId));

      const postsList: Post[] = [];
      postsSnap.forEach((docSnap) => {
        postsList.push(docSnap.data() as Post);
      });
      setPosts(postsList.length > 0 ? postsList : INITIAL_POSTS(userId, finalUser.displayName, finalUser.avatar));
    } catch (e) {
      console.warn("Gagal sinkronisasi data masuk dari Firestore, beralih ke LocalStorage:", e);
      const prefix = `akra_${userId}_`;
      setBooks(safeStorageGet<Book[]>(`${prefix}books`, []));
      setReadingProgress(safeStorageGet<ReadingProgress[]>(`${prefix}progress`, []));
      setGoals(safeStorageGet<ReadingGoal[]>(`${prefix}goals`, []));
      setPosts(safeStorageGet<Post[]>(`${prefix}posts`, []));
      setStories(safeStorageGet<Story[]>(`${prefix}stories`, []));
      setSavedPostIds(safeStorageGet<string[]>(`${prefix}saved_bookmarks`, []));
      setShelves(safeStorageGet<Shelf[]>(`${prefix}shelves`, []));
      setBuddyReads(safeStorageGet<BuddyRead[]>(`${prefix}buddy_reads`, []));
      setBuddyMessages(safeStorageGet<BuddyMessage[]>(`${prefix}buddy_messages`, []));
      setNotifications(safeStorageGet<Notification[]>(`${prefix}notifications`, []));
    }
  };

  // Sync to Firestore via chunked writeBatch (only current user's owned documents)
  const syncDataToFirestore = async () => {
    if (isDemoMode || !db || currentUser.id === 'guest') return;
    try {
      const owned = filterOwnedRecordsForSync(currentUser.id, {
        readingProgress,
        goals,
        posts,
      });

      const ops: Array<{ ref: ReturnType<typeof doc>; data: Record<string, unknown> }> = [
        ...books.map((book) => ({ ref: doc(db, 'books', book.id), data: cleanUndefined(book) })),
        ...owned.readingProgress.map((p) => ({ ref: doc(db, 'progress', p.id), data: cleanUndefined(p) })),
        ...owned.goals.map((g) => ({ ref: doc(db, 'goals', `${g.userId}_${g.year}`), data: cleanUndefined(g) })),
        ...owned.posts.map((post) => ({ ref: doc(db, 'posts', post.id), data: cleanUndefined(post) })),
      ];

      const CHUNK_SIZE = 450;
      for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db);
        for (const op of ops.slice(i, i + CHUNK_SIZE)) {
          batch.set(op.ref, op.data);
        }
        await batch.commit();
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
      safeStorageSet('akra_current_user', loggedUser);
    } else {
      if (!auth) {
        const msg = firebaseConfigError || 'Firebase Auth belum dikonfigurasi.';
        setActionError(msg);
        throw new Error(msg);
      }
      try {
        setActionError(null);
        await signInWithGoogleReal();
      } catch (err) {
        console.error("Gagal Login Google riil:", err);
        setActionError('Gagal masuk dengan Google. Silakan coba lagi.');
        throw err;
      }
    }
  };

  const logout = async () => {
    if (isDemoMode) {
      setCurrentUser(GUEST_USER);
      setIsLoggedIn(false);
      safeStorageRemove('akra_current_user');
      setViewedUser(null);
      setReadingProgress([]);
      setPosts([]);
      setGoals([]);
    } else if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Gagal Logout riil:", err);
        setActionError('Gagal keluar dari akun. Silakan coba lagi.');
      }
    }
  };

  // Actions
  const updateProgress = (bookId: string, page: number, status: ReadingProgress['status'], rating?: number, note?: string) => {
    if (currentUser.id === 'guest') return;

    const { nextProgressList, finalPage, finalStatus, didNewlyComplete } =
      computeProgressTransition({
        prevProgress: readingProgress,
        books,
        userId: currentUser.id,
        bookId,
        page,
        status,
        rating,
        idFactory: () => createUniqueId('p'),
      });

    setReadingProgress(nextProgressList);

    if (didNewlyComplete) {
      updateGoalCompletedCount(1);
    }

    // Automatically create a post for progress update or completion
    const targetBook = books.find((b) => b.id === bookId);
    if (targetBook) {
      let displayStatus = finalStatus === 'COMPLETED' 
        ? `Telah menyelesaikan membaca buku "${targetBook.title}"! 🎉` 
        : `Mencapai halaman ${finalPage} dari ${targetBook.totalPages} untuk buku "${targetBook.title}"`;
      
      if (note && note.trim()) {
        displayStatus = `"${note.trim()}" — Catatan progres buku "${targetBook.title}" (Hal ${finalPage}/${targetBook.totalPages})`;
      }
      
      addPost(
        'PROGRESS_UPDATE',
        displayStatus,
        bookId,
        finalPage,
        rating
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

  const addPost = (type: 'QUOTE' | 'THOUGHT' | 'PROGRESS_UPDATE' | 'PHOTO', content: string, bookId?: string, page?: number, rating?: number, imageUrl?: string) => {
    if (currentUser.id === 'guest') return;

    const book = books.find((b) => b.id === bookId);
    const newPost: Post = {
      id: createUniqueId('post'),
      userId: currentUser.id,
      userDisplayName: currentUser.displayName,
      userAvatar: currentUser.avatar,
      type,
      bookId,
      bookTitle: book?.title,
      content,
      imageUrl,
      currentPage: page,
      totalPages: book?.totalPages,
      likes: [],
      comments: [],
      rating,
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) => [newPost, ...prev]);
  };

  const deletePost = async (postId: string) => {
    const targetPost = posts.find((p) => p.id === postId);
    if (!canDeletePost(targetPost, currentUser.id)) return;

    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (!isDemoMode && currentUser.id !== 'guest' && db) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
      } catch (e) {
        console.error("Gagal menghapus postingan dari Firestore:", e);
        setActionError('Gagal menghapus postingan dari server.');
      }
    }
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
      id: createUniqueId('comment'),
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

    const safeTargetBooks = clampGoalTarget(targetBooks);
    const currentYear = new Date().getFullYear();
    setGoals((prev) => {
      const existingIdx = prev.findIndex((g) => g.userId === currentUser.id && g.year === currentYear);
      const newGoals = [...prev];
      if (existingIdx > -1) {
        newGoals[existingIdx] = {
          ...newGoals[existingIdx],
          targetBooks: safeTargetBooks,
        };
      } else {
        newGoals.push({
          userId: currentUser.id,
          year: currentYear,
          targetBooks: safeTargetBooks,
          completedBooksCount: 0,
        });
      }
      return newGoals;
    });
  };

  const addBook = (title: string, author: string, totalPages: number, category: string, coverImage?: string) => {
    if (currentUser.id === 'guest') return undefined;

    const newBook: Book = {
      id: createUniqueId('b'),
      title,
      author,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80',
      totalPages,
      category,
    };
    setBooks((prev) => [...prev, newBook]);
    return newBook;
  };

  const addStory = (content: string, bookTitle?: string) => {
    if (currentUser.id === 'guest') return;
    const newStory: Story = {
      id: createUniqueId('story'),
      userId: currentUser.id,
      userDisplayName: currentUser.displayName,
      userAvatar: currentUser.avatar,
      bookTitle,
      content,
      createdAt: new Date().toISOString(),
    };
    setStories((prev) => [newStory, ...prev]);
  };

  const toggleSavePost = (postId: string) => {
    if (currentUser.id === 'guest') return;
    setSavedPostIds((prev) => {
      const exists = prev.includes(postId);
      if (exists) {
        return prev.filter((id) => id !== postId);
      } else {
        return [...prev, postId];
      }
    });
  };

  const addShelf = (name: string) => {
    if (currentUser.id === 'guest') return;
    const newShelf: Shelf = {
      id: createUniqueId('shelf'),
      userId: currentUser.id,
      name,
      bookIds: []
    };
    setShelves((prev) => [...prev, newShelf]);
  };

  const assignBookToShelves = (bookId: string, shelfIds: string[]) => {
    setShelves((prev) =>
      prev.map((s) => {
        const isSelected = shelfIds.includes(s.id);
        const hasBook = s.bookIds.includes(bookId);
        
        if (isSelected && !hasBook) {
          return { ...s, bookIds: [...s.bookIds, bookId] };
        } else if (!isSelected && hasBook) {
          return { ...s, bookIds: s.bookIds.filter((id) => id !== bookId) };
        }
        return s;
      })
    );
  };

  const startBuddyRead = (bookId: string, buddyUserId: string) => {
    if (currentUser.id === 'guest') return;
    
    // Check if buddy read already exists for this book and these users
    const exists = buddyReads.some(
      (br) => br.bookId === bookId && br.userIds.includes(currentUser.id) && br.userIds.includes(buddyUserId)
    );
    if (exists) return;

    const newBuddyRead: BuddyRead = {
      id: createUniqueId('br'),
      userIds: [currentUser.id, buddyUserId],
      bookId,
      createdAt: new Date().toISOString()
    };

    setBuddyReads((prev) => [...prev, newBuddyRead]);
  };

  const addBuddyMessage = (buddyReadId: string, content: string) => {
    if (currentUser.id === 'guest' || !content.trim()) return;
    
    const newMessage: BuddyMessage = {
      id: createUniqueId('bm'),
      buddyReadId,
      userId: currentUser.id,
      userDisplayName: currentUser.displayName,
      userAvatar: currentUser.avatar,
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    setBuddyMessages((prev) => [...prev, newMessage]);
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const followUser = (targetUserId: string) => {
    if (currentUser.id === 'guest' || currentUser.id === targetUserId) return;

    const alreadyFollowing = (currentUser.followingIds || []).includes(targetUserId);

    // Update currentUser
    const updatedCurrentUser = {
      ...currentUser,
      followingIds: alreadyFollowing
        ? (currentUser.followingIds || []).filter(id => id !== targetUserId)
        : [...(currentUser.followingIds || []), targetUserId]
    };
    setCurrentUser(updatedCurrentUser);
    if (isDemoMode) {
      safeStorageSet('akra_current_user', updatedCurrentUser);
    }

    // Update target user in users list
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) return updatedCurrentUser;
      if (u.id === targetUserId) {
        return {
          ...u,
          followerIds: alreadyFollowing
            ? (u.followerIds || []).filter(id => id !== currentUser.id)
            : [...(u.followerIds || []), currentUser.id]
        };
      }
      return u;
    }));
  };

  const isFollowing = (targetUserId: string): boolean => {
    return (currentUser.followingIds || []).includes(targetUserId);
  };

  const updateProfile = async (updates: Partial<Omit<User, 'id'>>) => {
    if (currentUser.id === 'guest') return;

    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);

    if (isDemoMode) {
      safeStorageSet('akra_current_user', updatedUser);
    } else if (db) {
      try {
        await setDoc(doc(db, 'users', currentUser.id), cleanUndefined(updatedUser));
      } catch (e) {
        console.error("Gagal menyimpan profil ke Firestore:", e);
        setActionError('Gagal menyimpan perubahan profil ke server.');
      }
    }

    // Update in users list
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u))
    );

    // Update posts and comments to reflect new profile info
    setPosts((prev) =>
      prev.map((post) => {
        let updatedPost = { ...post };
        if (post.userId === currentUser.id) {
          if (updates.displayName) updatedPost.userDisplayName = updates.displayName;
          if (updates.avatar) updatedPost.userAvatar = updates.avatar;
        }
        updatedPost.comments = post.comments.map((comment) => {
          if (comment.userId === currentUser.id) {
            let updatedComment = { ...comment };
            if (updates.displayName) updatedComment.displayName = updates.displayName;
            if (updates.avatar) updatedComment.avatar = updates.avatar;
            return updatedComment;
          }
          return comment;
        });
        return updatedPost;
      })
    );
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
        globalSearchQuery,
        setGlobalSearchQuery,
        selectedBookSuggestion,
        setSelectedBookSuggestion,
        selectedBook,
        setSelectedBook,
        previousTab,
        setPreviousTab,
        viewBookDetails,
        loginWithGoogle,
        logout,
        updateProgress,
        addPost,
        deletePost,
        likePost,
        addComment,
        setGoal,
        addBook,
        updateProfile,
        stories,
        addStory,
        savedPostIds,
        toggleSavePost,
        isLoaded,
        shelves,
        addShelf,
        assignBookToShelves,
        buddyReads,
        buddyMessages,
        startBuddyRead,
        addBuddyMessage,
        notifications,
        unreadNotificationCount: notifications.filter(n => !n.isRead).length,
        markAllNotificationsRead,
        followUser,
        isFollowing,
        language,
        setLanguage,
        actionError,
        clearActionError,
        toast,
        showToast,
        clearToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const translations = {
  id: {
    // Header & BottomNav
    searchPlaceholder: "Cari judul buku atau penulis...",
    home: "Beranda",
    myBooks: "Perpustakaan Saya",
    buddyRead: "Baca Bareng",
    profile: "Profil",
    myProfile: "Profil Saya",
    logout: "Keluar",
    loginWithGoogle: "Masuk dengan Google",
    searchingBook: "Mencari buku...",
    newBooks: "Buku Baru",
    noResults: "Tidak ada hasil yang ditemukan.",
    viewAllNotif: "Lihat semua aktivitas →",
    // Feed
    feedTitle: "Aktivitas Terbaru",
    recomBookmates: "Rekomendasi dari Bookmates",
    currReadingWidget: "Sedang Dibaca",
    noActiveBooks: "Belum ada buku aktif. Silakan pilih buku dari perpustakaan.",
    viewAll: "Lihat Semua",
    addBook: "Tambah Buku",
    noRecommendations: "Belum Ada Rekomendasi",
    inviteFriends: "Undang atau ikuti teman lain untuk melihat rekomendasi bacaan mereka.",
    like: "Suka",
    comment: "Komentar",
    save: "Simpan",
    saved: "Tersimpan",
    delete: "Hapus",
    rateIt: "Beri rating:",
    wantToRead: "Ingin Baca",
    currentlyReading: "Sedang Membaca",
    read: "Selesai Membaca",
    writeCommentPlaceholder: "Tulis komentar...",
    deleteActivityTitle: "Hapus Aktivitas?",
    deleteActivityConfirm: "Apakah Anda yakin ingin menghapus aktivitas membaca ini? Tindakan ini tidak dapat dibatalkan.",
    cancel: "Batal",
    shareQuoteTitle: "Bagikan Kutipan",
    shareThoughtTitle: "Bagikan Pemikiran",
    sharePhotoTitle: "Bagikan Foto",
    postButton: "Posting",
    selectBookPlaceholder: "Pilih buku terkait...",
    // Library
    libraryTitle: "Perpustakaan Saya",
    libraryDesc: "Kelola koleksi buku Anda dan catat progres membaca harian.",
    allBooks: "Semua Buku",
    wantToReadShelf: "Rencana Baca",
    currentlyReadingShelf: "Sedang dibaca",
    completedShelf: "Selesai dibaca",
    pagesOf: "halaman",
    currentPage: "Halaman saat ini:",
    // Profile
    bookshelf: "Rak Buku",
    updates: "Aktivitas",
    quotes: "Kutipan",
    readingGoal: "Target Membaca",
    completed: "Selesai",
    booksCompleted: "buku selesai",
    noActivity: "Belum ada aktivitas.",
    startActivityDesc: "Update progres buku untuk memulai!",
    noQuotes: "Belum ada kutipan.",
    shareQuoteDesc: "Bagikan kutipan favorit dari buku yang kamu baca!",
    readingStats: "Statistik Membaca",
    avgRating: "Rating Rata-rata",
    pagesReadCount: "Halaman",
    editProfile: "Edit Profil",
    saveProfile: "Simpan Perubahan",
    // Details
    rateThisBook: "Beri nilai untuk buku ini",
    aboutAuthor: "Tentang Penulis",
    bookDetailsEditions: "Detail buku & edisi",
    noPenilaian: "Belum ada penilaian",
    sedangMembaca: "sedang membaca",
    inginMembaca: "ingin membaca",
    selesaiMembaca: "selesai membaca",
    noAppUsersProgress: "Belum ada pengguna aplikasi yang mencatat progres untuk buku ini.",
    firstPublished: "Pertama kali diterbitkan",
    simpan: "Simpan"
  },
  en: {
    // Header & BottomNav
    searchPlaceholder: "Search book title or author...",
    home: "Home",
    myBooks: "My Library",
    buddyRead: "Buddy Read",
    profile: "Profile",
    myProfile: "My Profile",
    logout: "Log Out",
    loginWithGoogle: "Sign in with Google",
    searchingBook: "Searching books...",
    newBooks: "New Books",
    noResults: "No results found.",
    viewAllNotif: "View all activity →",
    // Feed
    feedTitle: "Recent Activity",
    recomBookmates: "Recommendations from Bookmates",
    currReadingWidget: "Currently Reading",
    noActiveBooks: "No active books. Please select a book from library.",
    viewAll: "View All",
    addBook: "Add Book",
    noRecommendations: "No Recommendations Yet",
    inviteFriends: "Invite or follow other friends to see their reading recommendations.",
    like: "Like",
    comment: "Comment",
    save: "Save",
    saved: "Saved",
    delete: "Delete",
    rateIt: "Rate it:",
    wantToRead: "Want to Read",
    currentlyReading: "Currently Reading",
    read: "Read",
    writeCommentPlaceholder: "Write a comment...",
    deleteActivityTitle: "Delete Activity?",
    deleteActivityConfirm: "Are you sure you want to delete this reading activity? This action cannot be undone.",
    cancel: "Cancel",
    shareQuoteTitle: "Share Quote",
    shareThoughtTitle: "Share Thought",
    sharePhotoTitle: "Share Photo",
    postButton: "Post",
    selectBookPlaceholder: "Select related book...",
    // Library
    libraryTitle: "My Library",
    libraryDesc: "Manage your book collection and log daily reading progress.",
    allBooks: "All Books",
    wantToReadShelf: "Want to Read",
    currentlyReadingShelf: "Currently Reading",
    completedShelf: "Completed",
    pagesOf: "pages",
    currentPage: "Current page:",
    // Profile
    bookshelf: "Bookshelf",
    updates: "Updates",
    quotes: "Quotes",
    readingGoal: "Reading Goal",
    completed: "Completed",
    booksCompleted: "books completed",
    noActivity: "No activity yet.",
    startActivityDesc: "Update book progress to start!",
    noQuotes: "No quotes yet.",
    shareQuoteDesc: "Share your favorite quote from the book you're reading!",
    readingStats: "Reading Statistics",
    avgRating: "Avg Rating",
    pagesReadCount: "Pages",
    editProfile: "Edit Profile",
    saveProfile: "Save Changes",
    // Details
    rateThisBook: "Rate this book",
    aboutAuthor: "About the Author",
    bookDetailsEditions: "Book details & editions",
    noPenilaian: "No ratings yet",
    sedangMembaca: "currently reading",
    inginMembaca: "want to read",
    selesaiMembaca: "finished reading",
    noAppUsersProgress: "No app users have logged progress for this book yet.",
    firstPublished: "First published",
    simpan: "Save"
  }
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
