import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDrFfZ7zEx2TXR1Dwwp_C88kBjxJlAKRrE",
  authDomain: "ready-pa-la-semana.firebaseapp.com",
  projectId: "ready-pa-la-semana",
  storageBucket: "ready-pa-la-semana.firebasestorage.app",
  messagingSenderId: "952187568039",
  appId: "1:952187568039:web:ca2a82cb5ac72537530082",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
