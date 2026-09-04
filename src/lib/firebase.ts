import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  serverTimestamp,
} from 'firebase/firestore';

// Dynamic and resilient Firebase configuration loader
// Priority:
// 1. Environment variables (VITE_FIREBASE_*) - safest for public CI/CD and deployment
// 2. Local gitignored firebase-applet-config.json (for AI Studio development)
// 3. Fallback placeholder (prevents crash on clean clone)
const localConfigFiles = import.meta.glob<{ default: Record<string, any> }>(
  '../../firebase-applet-config.json',
  { eager: true }
);

const localConfig = localConfigFiles['../../firebase-applet-config.json']?.default || {};

const envConfig: Record<string, any> = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID,
};

const cleanEnvConfig = Object.fromEntries(
  Object.entries(envConfig).filter(([_, v]) => typeof v === 'string' && v.trim().length > 0)
);

interface FirebaseAppConfig {
  apiKey: string;
  projectId: string;
  appId: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  firestoreDatabaseId?: string;
  [key: string]: any;
}

const firebaseConfig: FirebaseAppConfig = {
  apiKey: 'demo-api-key',
  projectId: 'demo-project',
  appId: '1:000000000000:web:000000000000',
  ...localConfig,
  ...cleanEnvConfig,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use provisioned firestore database ID if specified
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInAnonymously,
  firebaseSignOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  serverTimestamp,
};
export type { User };
