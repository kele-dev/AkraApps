import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if actual configuration keys exist
const hasFirebaseConfig = 
  !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "undefined" &&
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.startsWith("MASUKKAN_") &&
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.startsWith("YOUR_");

let app;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;
let isDemoMode = true;

if (hasFirebaseConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    isDemoMode = false;
  } catch (error) {
    console.error("Gagal menginisialisasi Firebase SDK asli, beralih ke Mode Demo:", error);
    isDemoMode = true;
  }
} else {
  console.log("Firebase API Key tidak ditemukan. AKRA berjalan dalam Mode Demo dengan simulasi Google Login.");
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
    throw new Error("Firebase Auth belum diinisialisasi.");
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export { auth, db, isDemoMode };
