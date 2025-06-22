// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDjKldrlQh6ONoX5KBHEL_xmso21QcZvlg",
  authDomain: "wedding-site-97a76.firebaseapp.com",
  projectId: "wedding-site-97a76",
  storageBucket: "wedding-site-97a76.firebasestorage.app",
  messagingSenderId: "860652556342",
  appId: "1:860652556342:web:8cf50a7628266e52658897",
  measurementId: "G-3D6BB5T79V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
export const storage = getStorage(app);
export const db = getFirestore(app);
