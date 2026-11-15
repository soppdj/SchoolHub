import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeySdKhoirurRooziqiin2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'schoolhub-sd-khoirur-rooziqiin.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'schoolhub-sd-khoirur-rooziqiin',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'schoolhub-sd-khoirur-rooziqiin.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
};

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID
);

// Initialize Firebase App singleton
export const firebaseApp: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const firestore: Firestore = getFirestore(firebaseApp);
export const auth: Auth = getAuth(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);

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
