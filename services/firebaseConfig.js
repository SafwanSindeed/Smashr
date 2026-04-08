import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDDql5XY_UOm20Al_yTCrLn6u4XrAYY9EE",
  authDomain: "smashr-55708.firebaseapp.com",
  projectId: "smashr-55708",
  storageBucket: "smashr-55708.firebasestorage.app",
  messagingSenderId: "459706072092",
  appId: "1:459706072092:web:af78a7382ea2f15b5333d9",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);