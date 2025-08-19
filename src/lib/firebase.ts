import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Firebase 설정 (직접 하드코딩)
const firebaseConfig = {
  apiKey: "AIzaSyBuqtsInY2RwGsAtblcZbVLz-75S82VUmc",
  authDomain: "flowershoper-pv1.firebaseapp.com",
  projectId: "flowershoper-pv1",
  storageBucket: "flowershoper-pv1.firebasestorage.app",
  messagingSenderId: "875038211942",
  appId: "1:875038211942:web:31f55a6c1558481ca152a7",
};
// Initialize Firebase
let app;
let auth;
let storage;
let db;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  storage = getStorage(app);
  try {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache()
    });
  } catch (error) {
    db = getFirestore(app);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}
export { app, auth, db, storage };
