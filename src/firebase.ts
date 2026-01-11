// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

// ⚠️ 아까 파이어베이스 사이트에서 복사한 내용으로 여기를 채우세요!
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBSv3kzR0kl24oVgXk1u1oQU_T21amr19Q",
  authDomain: "jblack-tarot-website.firebaseapp.com",
  projectId: "jblack-tarot-website",
  storageBucket: "jblack-tarot-website.firebasestorage.app",
  messagingSenderId: "1063168464630",
  appId: "1:1063168464630:web:fa3c53f617025cf14bfed7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// 파이어베이스 시작
const app = initializeApp(firebaseConfig);

// 기능들 내보내기
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// 로그인 함수 (App.tsx에서 쓸 것)
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

// 로그아웃 함수
export const logOut = async () => {
    await signOut(auth);
};
