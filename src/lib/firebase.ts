import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBG6K_bapxBVBbH10jh7qBoRImGiIii--E",
  authDomain: "sound-plane-6f4nj.firebaseapp.com",
  projectId: "sound-plane-6f4nj",
  storageBucket: "sound-plane-6f4nj.firebasestorage.app",
  messagingSenderId: "344948542072",
  appId: "1:344948542072:web:a23bc2b9d416cf748bbb8d"
};

let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase connected successfully!");
} catch (error) {
  console.error("Firebase configuration error:", error);
}

export const auth = getAuth(app!);
export const db = getFirestore(app!, "ai-studio-remixsmartledger-203e7f93-0745-42a5-b0bc-6dd0e2dc9049");

export async function ensureAuth() {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      console.log("Firebase Authentication successful!");
    } catch (err) {
      console.warn("Firebase Anonymous Auth restricted or not enabled. Continuing with default Firestore access.", err);
    }
  }
}
