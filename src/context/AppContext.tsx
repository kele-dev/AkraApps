"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { User, Book, ReadingProgress, Post, ReadingGoal, Comment, Story, Shelf, BuddyRead, BuddyMessage, Notification } from '../types';
import { auth, db, isDemoMode, simulateGoogleSignIn, signInWithGoogleReal } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, deleteDoc } from 'firebase/firestore';

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

// The four Firestore collections this app mirrors, and the state slices they come from.
type SyncableState = {
  books: Book[];
  readingProgress: ReadingProgress[];
  goals: ReadingGoal[];
  posts: Post[];
};

// Doc id -> normalized payload, per collection name. Everything already stored
// remotely, so the persist effect only writes what actually differs.
type FirestoreSyncSnapshot = Record<string, Map<string, string>>;

type SyncableDoc = Book | ReadingProgress | ReadingGoal | Post;

// The feed is the only collection that grows without bound, so it is read
// newest-first and capped. users/books/progress/goals stay complete: the feed,
// book-details counts and profile browsing aggregate over every member.
const FEED_POST_LIMIT = 200;

// Cross-user "recent reading activity" is bounded by date and row count.
const RECENT_PROGRESS_WINDOW_DAYS = 90;
const RECENT_PROGRESS_LIMIT = 50;

const buildSyncDocs = (
  state: SyncableState
): Record<string, Array<{ id: string; data: SyncableDoc }>> => ({
  books: state.books.map((b) => ({ id: b.id, data: b })),
  progress: state.readingProgress.map((p) => ({ id: p.id, data: p })),
  goals: state.goals.map((g) => ({ id: `${g.userId}_${g.year}`, data: g })),
  posts: state.posts.map((p) => ({ id: p.id, data: p })),
});

const buildSyncHashes = (state: SyncableState): FirestoreSyncSnapshot => {
  const hashes: FirestoreSyncSnapshot = {};
  for (const [collectionName, docs] of Object.entries(buildSyncDocs(state))) {
    const map = new Map<string, string>();
    for (const d of docs) map.set(d.id, JSON.stringify(cleanUndefined(d.data)));
    hashes[collectionName] = map;
  }
  return hashes;
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
  loadProgressForUser: (userId: string) => Promise<void>;
  loadProgressForBooks: (bookIds: string[]) => Promise<void>;
  loadRecentProgress: () => Promise<void>;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Members arrive from Firestore on sign-in; there are no built-in accounts.
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [language, setLanguageState] = useState<'id' | 'en'>('id');

  // Load language preference on load
  useEffect(() => {
    const savedLang = localStorage.getItem('akra_language');
    if (savedLang === 'id' || savedLang === 'en') {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: 'id' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem('akra_language', lang);
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
  };

  // Core App states
  const [books, setBooks] = useState<Book[]>([]);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [buddyReads, setBuddyReads] = useState<BuddyRead[]>([]);
  const [buddyMessages, setBuddyMessages] = useState<BuddyMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Baseline of the last payload written per Firestore doc, scoped to the user
  // it was read for. Reset whenever the signed-in user changes.
  const firestoreSyncRef = useRef<{ userId: string; docs: FirestoreSyncSnapshot }>({
    userId: '',
    docs: {},
  });

  // Progress rows already fetched, keyed by the scope that fetched them, so
  // revisiting a profile or a book does not query again.
  const progressScopesRef = useRef<Set<string>>(new Set());

  // 1. Listen to Real Firebase Auth (if not demo mode)
  useEffect(() => {
    if (isDemoMode) {
      // Load user session from LocalStorage
      const savedUser = localStorage.getItem('akra_current_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
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
        progressScopesRef.current = new Set();
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
      // Mirrors the keys written by the persist effect below, so a demo session
      // reloads exactly what it saved.
      const readStored = <T,>(key: string): T[] => {
        const stored = localStorage.getItem(`${prefix}${key}`);
        return stored ? (JSON.parse(stored) as T[]) : [];
      };

      setBooks(readStored<Book>('books'));
      setReadingProgress(readStored<ReadingProgress>('progress'));
      setPosts(readStored<Post>('posts'));
      setGoals(readStored<ReadingGoal>('goals'));
      setStories(readStored<Story>('stories'));
      setSavedPostIds(readStored<string>('saved_bookmarks'));
      setShelves(readStored<Shelf>('shelves'));
      setBuddyReads(readStored<BuddyRead>('buddy_reads'));
      setBuddyMessages(readStored<BuddyMessage>('buddy_messages'));
      setNotifications(readStored<Notification>('notifications'));
    }
  }, [currentUser, isLoaded]);

  // 3. Save User Specific Data when state changes (Always mirror to LocalStorage, sync to Firestore if real)
  useEffect(() => {
    if (!isLoaded || currentUser.id === 'guest') return;

    const prefix = `akra_${currentUser.id}_`;
    localStorage.setItem(`${prefix}books`, JSON.stringify(books));
    localStorage.setItem(`${prefix}progress`, JSON.stringify(readingProgress));
    localStorage.setItem(`${prefix}posts`, JSON.stringify(posts));
    localStorage.setItem(`${prefix}goals`, JSON.stringify(goals));
    localStorage.setItem(`${prefix}stories`, JSON.stringify(stories));
    localStorage.setItem(`${prefix}saved_bookmarks`, JSON.stringify(savedPostIds));
    localStorage.setItem(`${prefix}shelves`, JSON.stringify(shelves));
    localStorage.setItem(`${prefix}buddy_reads`, JSON.stringify(buddyReads));
    localStorage.setItem(`${prefix}buddy_messages`, JSON.stringify(buddyMessages));
    localStorage.setItem(`${prefix}notifications`, JSON.stringify(notifications));

    if (!isDemoMode) {
      syncDataToFirestore({ books, readingProgress, goals, posts });
    }
  }, [books, readingProgress, posts, goals, stories, savedPostIds, shelves, buddyReads, buddyMessages, notifications, currentUser, isLoaded]);

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

      // Shared, cross-member collections: the feed, the book catalog, the
      // book-details social counts and profile browsing all read other members'
      // documents, so they cannot be narrowed by userId. Read them together
      // instead of one round trip at a time, and cap the feed.
      const [booksSnap, usersSnap, progressSnap, goalsSnap, postsSnap] = await Promise.all([
        getDocs(collection(db, 'books')),
        getDocs(collection(db, 'users')),
        // Only the signed-in member's rows; others load per user or per book.
        getDocs(query(collection(db, 'progress'), where('userId', '==', userId))),
        getDocs(collection(db, 'goals')),
        getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(FEED_POST_LIMIT))),
      ]);

      const booksList = booksSnap.docs.map((snap) => snap.data() as Book);
      const usersList = usersSnap.docs.map((snap) => snap.data() as User);
      const progressList = progressSnap.docs.map((snap) => snap.data() as ReadingProgress);
      const goalsList = goalsSnap.docs.map((snap) => snap.data() as ReadingGoal);
      const postsList = postsSnap.docs.map((snap) => snap.data() as Post);

      setBooks(booksList);
      setUsers(usersList);
      setReadingProgress(progressList);
      setGoals(goalsList);
      setPosts(postsList);

      // Other members' rows are fetched on demand, so start from this scope.
      progressScopesRef.current = new Set([`user:${userId}`]);

      // Everything above is already stored remotely: record it as the sync
      // baseline so the persist effect does not echo the whole collection back.
      firestoreSyncRef.current = {
        userId,
        docs: buildSyncHashes({
          books: booksList,
          readingProgress: progressList,
          goals: goalsList,
          posts: postsList,
        }),
      };
    } catch (e) {
      console.warn("Gagal sinkronisasi data masuk dari Firestore, beralih ke LocalStorage:", e);
      const prefix = `akra_${userId}_`;
      const savedBooks = localStorage.getItem(`${prefix}books`);
      const savedProgress = localStorage.getItem(`${prefix}progress`);
      const savedPosts = localStorage.getItem(`${prefix}posts`);
      const savedGoals = localStorage.getItem(`${prefix}goals`);
      const savedStories = localStorage.getItem(`${prefix}stories`);
      const savedBookmarks = localStorage.getItem(`${prefix}saved_bookmarks`);
      const savedShelves = localStorage.getItem(`${prefix}shelves`);
      const savedBuddyReads = localStorage.getItem(`${prefix}buddy_reads`);
      const savedBuddyMessages = localStorage.getItem(`${prefix}buddy_messages`);
      const savedNotifications = localStorage.getItem(`${prefix}notifications`);

      if (savedBooks) setBooks(JSON.parse(savedBooks));
      if (savedProgress) setReadingProgress(JSON.parse(savedProgress));
      if (savedGoals) setGoals(JSON.parse(savedGoals));
      if (savedPosts) setPosts(JSON.parse(savedPosts));
      if (savedStories) setStories(JSON.parse(savedStories));
      if (savedBookmarks) setSavedPostIds(JSON.parse(savedBookmarks));
      if (savedShelves) setShelves(JSON.parse(savedShelves));
      if (savedBuddyReads) setBuddyReads(JSON.parse(savedBuddyReads));
      if (savedBuddyMessages) setBuddyMessages(JSON.parse(savedBuddyMessages));
      if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    }
  };

  // Sync to Firestore — writes only the docs whose payload changed since the
  // last sync. Unrelated state changes (likes, language, stories, ...) become
  // no-ops instead of rewriting every collection.
  const syncDataToFirestore = async (state: SyncableState) => {
    if (isDemoMode || currentUser.id === 'guest') return;

    // A different account owns a different baseline.
    if (firestoreSyncRef.current.userId !== currentUser.id) {
      firestoreSyncRef.current = { userId: currentUser.id, docs: {} };
    }
    const synced = firestoreSyncRef.current.docs;

    try {
      for (const [collectionName, docs] of Object.entries(buildSyncDocs(state))) {
        const previous = synced[collectionName] ?? new Map<string, string>();
        const next = new Map<string, string>();
        const changedIds: string[] = [];
        const writes: Array<Promise<unknown>> = [];

        for (const d of docs) {
          const payload = cleanUndefined(d.data);
          const hash = JSON.stringify(payload);
          next.set(d.id, hash);
          if (previous.get(d.id) !== hash) {
            changedIds.push(d.id);
            writes.push(setDoc(doc(db, collectionName, d.id), payload));
          }
        }

        // Record the new baseline before awaiting, so overlapping state changes
        // do not schedule the same document twice.
        synced[collectionName] = next;
        if (writes.length === 0) continue;

        try {
          await Promise.all(writes);
        } catch (writeError) {
          // Forget the failed docs so the next state change retries them.
          for (const id of changedIds) next.delete(id);
          throw writeError;
        }
      }
    } catch (e) {
      console.error("Gagal sinkronisasi data keluar ke Firestore:", e);
    }
  };

  // Progress is never read as a whole collection. Rows are fetched for the
  // signed-in member, for the book being viewed, or for recent activity.
  const mergeProgress = useCallback((rows: ReadingProgress[]) => {
    if (rows.length === 0) return;
    setReadingProgress((prev) => {
      const byId = new Map(prev.map((row) => [row.id, row]));
      for (const row of rows) byId.set(row.id, row);
      return [...byId.values()];
    });
  }, []);

  const loadProgressForUser = useCallback(async (targetUserId: string) => {
    if (isDemoMode || currentUser.id === 'guest') return;
    const key = `user:${targetUserId}`;
    if (progressScopesRef.current.has(key)) return;
    progressScopesRef.current.add(key);
    try {
      const snap = await getDocs(query(collection(db, 'progress'), where('userId', '==', targetUserId)));
      mergeProgress(snap.docs.map((row) => row.data() as ReadingProgress));
    } catch (e) {
      progressScopesRef.current.delete(key);
      console.warn("Gagal memuat progres pengguna:", e);
    }
  }, [currentUser.id, mergeProgress]);

  const loadProgressForBooks = useCallback(async (bookIds: string[]) => {
    if (isDemoMode || currentUser.id === 'guest' || bookIds.length === 0) return;
    // Firestore caps `in` at 30 values; library copies of one title rarely exceed it.
    const ids = bookIds.slice(0, 30);
    const key = `books:${[...ids].sort().join(',')}`;
    if (progressScopesRef.current.has(key)) return;
    progressScopesRef.current.add(key);
    try {
      const snap = await getDocs(query(collection(db, 'progress'), where('bookId', 'in', ids)));
      mergeProgress(snap.docs.map((row) => row.data() as ReadingProgress));
    } catch (e) {
      progressScopesRef.current.delete(key);
      console.warn("Gagal memuat progres buku:", e);
    }
  }, [currentUser.id, mergeProgress]);

  const loadRecentProgress = useCallback(async () => {
    if (isDemoMode || currentUser.id === 'guest') return;
    const key = 'recent';
    if (progressScopesRef.current.has(key)) return;
    progressScopesRef.current.add(key);
    try {
      const since = new Date(Date.now() - RECENT_PROGRESS_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const snap = await getDocs(
        query(
          collection(db, 'progress'),
          where('updatedAt', '>=', since),
          orderBy('updatedAt', 'desc'),
          limit(RECENT_PROGRESS_LIMIT),
        ),
      );
      mergeProgress(snap.docs.map((row) => row.data() as ReadingProgress));
    } catch (e) {
      progressScopesRef.current.delete(key);
      console.warn("Gagal memuat aktivitas baca terbaru:", e);
    }
  }, [currentUser.id, mergeProgress]);

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
  const updateProgress = (bookId: string, page: number, status: ReadingProgress['status'], rating?: number, note?: string) => {
    if (currentUser.id === 'guest') return;

    let finalStatus = status;
    let finalPage = page;

    setReadingProgress((prev) => {
      const existingIdx = prev.findIndex((p) => p.userId === currentUser.id && p.bookId === bookId);
      const book = books.find((b) => b.id === bookId);
      const limitPage = book ? book.totalPages : page;
      
      finalStatus = status === 'COMPLETED' || page >= limitPage ? 'COMPLETED' : status;
      finalPage = finalStatus === 'COMPLETED' ? limitPage : Math.max(0, Math.min(page, limitPage));

      let newProgress = [...prev];
      if (existingIdx > -1) {
        newProgress[existingIdx] = {
          ...newProgress[existingIdx],
          currentPage: finalPage,
          status: finalStatus,
          rating: rating !== undefined ? rating : newProgress[existingIdx].rating,
          updatedAt: new Date().toISOString(),
        };
      } else {
        newProgress.push({
          id: `p_${Date.now()}`,
          userId: currentUser.id,
          bookId,
          currentPage: finalPage,
          status: finalStatus,
          rating,
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
      id: `post_${Date.now()}`,
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
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (!isDemoMode && currentUser.id !== 'guest') {
      try {
        await deleteDoc(doc(db, 'posts', postId));
      } catch (e) {
        console.error("Gagal menghapus postingan dari Firestore:", e);
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

  const addBook = (title: string, author: string, totalPages: number, category: string, coverImage?: string) => {
    if (currentUser.id === 'guest') return undefined;

    const newBook: Book = {
      id: `b_${Date.now()}`,
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
      id: `story_${Date.now()}`,
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
      id: `shelf_${Date.now()}`,
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
      id: `br_${Date.now()}`,
      userIds: [currentUser.id, buddyUserId],
      bookId,
      createdAt: new Date().toISOString()
    };

    setBuddyReads((prev) => [...prev, newBuddyRead]);
  };

  const addBuddyMessage = (buddyReadId: string, content: string) => {
    if (currentUser.id === 'guest' || !content.trim()) return;
    
    const newMessage: BuddyMessage = {
      id: `bm_${Date.now()}`,
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
      localStorage.setItem('akra_current_user', JSON.stringify(updatedCurrentUser));
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
      localStorage.setItem('akra_current_user', JSON.stringify(updatedUser));
    } else {
      try {
        await setDoc(doc(db, 'users', currentUser.id), cleanUndefined(updatedUser));
      } catch (e) {
        console.error("Gagal menyimpan profil ke Firestore:", e);
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
        loadProgressForUser,
        loadProgressForBooks,
        loadRecentProgress,
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
