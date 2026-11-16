import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAJoBGaLY2cOBcxmpsIoqz7aTER_RqcOU4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "schoolhub-sdkr.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "schoolhub-sdkr",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "schoolhub-sdkr.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "805545886799",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:805545886799:web:7df286e6fe71c03a8d963a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5W2LCJSRTJ",
};

export const isFirebaseConfigured = true;

// Initialize Firebase App singleton
export const firebaseApp: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const firestore: Firestore = getFirestore(firebaseApp);
export const auth: Auth = getAuth(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);

export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(firebaseApp);
    }
  });
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Firebase Authentication Helper Functions
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function loginWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Broadcast Channel for live multi-tab & cross-module instant reactivity
export type RealtimeEvent = {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRecord?: any;
  oldRecord?: any;
};

type RealtimeListener = (event: RealtimeEvent) => void;

class SchoolHubRealtimeHub {
  private listeners: Set<RealtimeListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('school_hub_realtime_channel');
      this.broadcastChannel.onmessage = (event) => {
        this.notify(event.data);
      };
    }
  }

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public broadcast(event: RealtimeEvent) {
    this.notify(event);
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(event);
    }
  }

  private notify(event: RealtimeEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Realtime notification error:', err);
      }
    });
  }
}

export const realtimeHub = new SchoolHubRealtimeHub();
