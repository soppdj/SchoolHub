import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from './firebase';

/**
 * Pushes a local record into Cloud Firestore with error handling
 */
export async function pushToFirestore(collectionName: string, id: string, data: any): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const docRef = doc(firestore, collectionName, id);
    // Remove undefined values which Firestore rejects
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    console.warn(`[FirestoreSync] Failed to push to ${collectionName}/${id}:`, err);
    return false;
  }
}

/**
 * Deletes a record from Cloud Firestore
 */
export async function deleteFromFirestore(collectionName: string, id: string): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const docRef = doc(firestore, collectionName, id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn(`[FirestoreSync] Failed to delete from ${collectionName}/${id}:`, err);
    return false;
  }
}

/**
 * Pulls all records from a Firestore collection
 */
export async function pullFromFirestore<T = any>(collectionName: string): Promise<T[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const colRef = collection(firestore, collectionName);
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
  } catch (err) {
    console.warn(`[FirestoreSync] Failed to pull ${collectionName}:`, err);
    return [];
  }
}

/**
 * Realtime listener for a Firestore collection
 */
export function listenToFirestoreCollection<T = any>(
  collectionName: string,
  onChange: (items: T[]) => void
): () => void {
  if (!isFirebaseConfigured) {
    return () => {};
  }
  try {
    const colRef = collection(firestore, collectionName);
    return onSnapshot(colRef, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
      onChange(items);
    }, (err) => {
      console.warn(`[FirestoreSync] Realtime snapshot error on ${collectionName}:`, err);
    });
  } catch {
    return () => {};
  }
}
