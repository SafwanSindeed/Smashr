// services/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: extra.FIREBASE_API_KEY,
  authDomain: extra.FIREBASE_AUTH_DOMAIN,
  projectId: extra.FIREBASE_PROJECT_ID,
  storageBucket: extra.SB,
  messagingSenderId: extra.MSG_ID,
  appId: extra.APP_ID,
  // measurementId removed (web analytics only)
};

// ✅ Prevent "Firebase App named '[DEFAULT]' already exists"
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Export Auth for your screens to use
export const auth = getAuth(app);
console.log("EXTRA:", extra);