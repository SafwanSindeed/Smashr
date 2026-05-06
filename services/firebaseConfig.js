import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDDql5XY_UOm20Al_yTCrLn6u4XrAYY9EE",
  authDomain: "smashr-55708.firebaseapp.com",
  projectId: "smashr-55708",
  storageBucket: "smashr-55708.firebasestorage.app",
  messagingSenderId: "459706072092",
  appId: "1:459706072092:web:6db95a2ed0d240cc5333d9",
  measurementId: "G-PW9V493Q8L"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const functions = getFunctions(app);

export const callFunction = async (name, data = {}, options = {}) => {
  const callable = httpsCallable(functions, name);
  const idToken =
    options.idToken ||
    (await auth.currentUser?.getIdToken(options.forceRefresh ?? false));

  return callable(idToken ? { ...data, idToken } : data);
};

export const auth = getAuth(app);
export const db = getFirestore(app);