// services/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAeoyLpTeU9sdpocsvh2JigMW-zGRA5r_I",
  authDomain: "smashr-d9077.firebaseapp.com",
  projectId: "smashr-d9077",
  storageBucket: "smashr-d9077.firebasestorage.app",
  messagingSenderId: "840128243641",
  appId: "1:840128243641:web:10731355ea58ee6dc3b868",
  // measurementId removed (web analytics only)
};

// ✅ Prevent "Firebase App named '[DEFAULT]' already exists"
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Export Auth for your screens to use
export const auth = getAuth(app);