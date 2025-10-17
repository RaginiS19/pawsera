// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDk-tSBwIYprotjCW4vBjG5PR_4ha9Pgkc",
  authDomain: "pawsera-5c5d5.firebaseapp.com",
  projectId: "pawsera-5c5d5",
  storageBucket: "pawsera-5c5d5.firebasestorage.app",
  messagingSenderId: "564660902729",
  appId: "1:564660902729:web:aba799e4a553eb2c4f5898",
  measurementId: "G-QPS04QZNHE"
};

// 🔹 Add this line to check which API key is actually being used
console.log("Firebase API Key:", firebaseConfig.apiKey);

// Initialize Firebase
let app, db, auth, storage;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  console.log("✅ Firebase initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization failed:", error);
  db = null;
  auth = null;
  storage = null;
}

export { db, auth, storage };
