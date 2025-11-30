import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { GridSection } from './types';

// --- CONFIGURATION ---
// TODO: Replace with your actual Firebase Project keys to enable the backend.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Check if config is valid (placeholder detection)
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

let db: any = null;
if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

// --- SERVICE LAYER ---

// Helper to save state (routes to Firebase or LocalStorage)
export const saveGameState = async (imageUrl: string, sections: GridSection[]) => {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "games", "wedding_puzzle"), {
      imageUrl,
      sections,
      updatedAt: new Date()
    });
  } else {
    localStorage.setItem('wedding_puzzle_data', JSON.stringify({ imageUrl, sections }));
    // Dispatch a storage event to trigger listener in the same window
    window.dispatchEvent(new Event('storage_update'));
  }
};

// Helper to unlock a section
export const unlockSectionInDb = async (index: number, currentSections: GridSection[]) => {
  const newSections = [...currentSections];
  newSections[index].isUnlocked = true;

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "games", "wedding_puzzle"), {
      sections: newSections
    });
  } else {
    const currentData = JSON.parse(localStorage.getItem('wedding_puzzle_data') || '{}');
    saveGameState(currentData.imageUrl, newSections);
  }
};

// Hook-like listener function
export const subscribeToGame = (callback: (data: any) => void) => {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, "games", "wedding_puzzle"), (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        callback(null);
      }
    });
  } else {
    // Local Storage Listener
    const checkLocal = () => {
      const data = localStorage.getItem('wedding_puzzle_data');
      callback(data ? JSON.parse(data) : null);
    };
    
    window.addEventListener('storage_update', checkLocal); // Custom event for same-window updates
    checkLocal(); // Initial check

    return () => window.removeEventListener('storage_update', checkLocal);
  }
};
