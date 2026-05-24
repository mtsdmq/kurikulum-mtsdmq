import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// PERHATIAN: Hapus dan ganti isi di dalam kurung kurawal ini dengan kode firebaseConfig milik Anda sendiri
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXX",
  authDomain: "mts-daarul-muqorrobin.firebaseapp.com",
  projectId: "mts-daarul-muqorrobin",
  storageBucket: "mts-daarul-muqorrobin.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
