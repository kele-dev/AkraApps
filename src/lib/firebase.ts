import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { resolveFirebaseMode } from './firebaseConfig';
import { logger } from './logger';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const mode = resolveFirebaseMode({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_ENABLE_DEMO_MODE: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE,
});

if (mode.hasFirebaseConfig && mode.missingKeys.length > 0) {
  logger.warn('firebase.config_partial', { missingKeys: mode.missingKeys });
}

let app;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let isDemoMode = mode.isDemoMode;
let firebaseConfigError: string | null = mode.configError;

if (mode.hasFirebaseConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    isDemoMode = false;
    firebaseConfigError = null;
  } catch (error) {
    logger.error('firebase.init_failed', { error });
    isDemoMode = false;
    firebaseConfigError = 'Firebase SDK initialization failed.';
  }
} else if (isDemoMode) {
  logger.info('firebase.demo_mode_active');
} else if (firebaseConfigError) {
  logger.warn('firebase.config_missing', { reason: firebaseConfigError });
}

// Interface for Mock User
export interface MockGoogleUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

// Simulasi Google Login Popup (untuk mode demo/lokal tanpa setup firebase)
export const simulateGoogleSignIn = (): Promise<MockGoogleUser> => {
  return new Promise((resolve) => {
    // Simulasi jeda popup loading
    setTimeout(() => {
      const mockAccounts = [
        {
          uid: 'g_user_bagus',
          email: 'bagus.dev@gmail.com',
          displayName: 'Bagus Dev',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        },
        {
          uid: 'g_user_budi',
          email: 'budi.reader@gmail.com',
          displayName: 'Budi Pembaca',
          photoURL: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
        }
      ];
      
      // Pilih akun pertama (Bagus Dev) secara default untuk demo
      resolve(mockAccounts[0]);
    }, 1000);
  });
};

// Fungsi Login Riil dengan Google
export const signInWithGoogleReal = async () => {
  if (!auth || !googleProvider) {
    throw new Error(firebaseConfigError || "Firebase Auth belum diinisialisasi.");
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export { auth, db, isDemoMode, firebaseConfigError };
