import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { auth } from "../services/firebaseConfig.js";
import { db } from "../services/firebaseConfig.js";
import { getDocs } from "firebase/firestore";

// ─────────────────────────────────────────────
// COLLECTION NAMES
// ─────────────────────────────────────────────
const USERS_COLLECTION = "users";
const GPN_CREDENTIALS_COLLECTION = "gpnCredentials";

// ─────────────────────────────────────────────
// HELPER: GET CURRENT USER
// ─────────────────────────────────────────────
function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user.");
  }
  return user;
}

// ─────────────────────────────────────────────
// 1. CREATE USER
// ─────────────────────────────────────────────
export async function createUser(userId, firstName, lastName, email) {
  if (!userId || !firstName || !lastName || !email) {
    throw new Error("createUser: userId, firstName, lastName, and email are all required.");
  }

  const fullName = `${firstName.trim()} ${lastName.trim()}`;
  const userRef = doc(db, USERS_COLLECTION, userId);

  await setDoc(userRef, {
    fullName,
    email: email.trim().toLowerCase(),
    userId: userRef,
    createdAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────
// 2a. SET FULL NAME
// ─────────────────────────────────────────────
export async function setFullName(firstName, lastName) {
  const user = getCurrentUser();

  if (!firstName || !lastName) {
    throw new Error("setFullName: firstName and lastName are required.");
  }

  const fullName = `${firstName.trim()} ${lastName.trim()}`;
  const userRef = doc(db, USERS_COLLECTION, user.uid);

  await setDoc(userRef, { fullName }, { merge: true });
}

// ─────────────────────────────────────────────
// 2b. SET EMAIL
// ─────────────────────────────────────────────
export async function setEmail(email) {
  const user = getCurrentUser();

  if (!email) {
    throw new Error("setEmail: email is required.");
  }

  const userRef = doc(db, USERS_COLLECTION, user.uid);
  await setDoc(userRef, { email: email.trim().toLowerCase() }, { merge: true });
}

// ─────────────────────────────────────────────
// 3. LISTENER: SUBSCRIBE TO CURRENT USER
// ─────────────────────────────────────────────
/**
 * Subscribes to real-time updates for the current user document.
 *
 * @param {(data: object | null) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribeToCurrentUser(callback) {
  const user = getCurrentUser();

  const userRef = doc(db, USERS_COLLECTION, user.uid);

  return onSnapshot(userRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback(snapshot.data());
  });
}

// ─────────────────────────────────────────────
// 4. LISTENER: FULL NAME
// ─────────────────────────────────────────────
export function subscribeToFullName(callback) {
  return subscribeToCurrentUser((data) => {
    callback(data?.fullName ?? null);
  });
}

// ─────────────────────────────────────────────
// 5. LISTENER: EMAIL
// ─────────────────────────────────────────────
export function subscribeToEmail(callback) {
  return subscribeToCurrentUser((data) => {
    callback(data?.email ?? null);
  });
}

// ─────────────────────────────────────────────
// 6. CREATE GPN CREDENTIALS (SUBCOLLECTION)
// ─────────────────────────────────────────────
export async function createGpnCredentials(gpnApiResponse) {
  const user = getCurrentUser();

  if (!gpnApiResponse) {
    throw new Error("createGpnCredentials: gpnApiResponse is required.");
  }

  let { id, sessionId, username } = gpnApiResponse;

  if (!id || !sessionId) {
    throw new Error("Missing required GPN fields.");
  }

  // 🔥 FIX: ensure string values
  id = String(id);
  sessionId = String(sessionId);
  username = username ? String(username) : "";

  const gpnRef = doc(
    collection(doc(db, USERS_COLLECTION, user.uid), GPN_CREDENTIALS_COLLECTION),
    id
  );

  await setDoc(gpnRef, {
    gpnId: id,
    sessionId,
    username,
    userId: user.uid,
    createdAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────
// 7. LISTENER: GPN CREDENTIALS
// ─────────────────────────────────────────────
export function subscribeToGpnCredentials(callback) {
  const user = getCurrentUser();

  const gpnCollectionRef = collection(
    db,
    USERS_COLLECTION,
    user.uid,
    GPN_CREDENTIALS_COLLECTION
  );

  return onSnapshot(gpnCollectionRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(data);
  });
}

// ─────────────────────────────────────────────
// 8. GET GPN ID (one-time read)
// ─────────────────────────────────────────────
export async function getGpnId() {
  const user = getCurrentUser();

  const gpnCollectionRef = collection(
    db,
    USERS_COLLECTION,
    user.uid,
    GPN_CREDENTIALS_COLLECTION
  );

  const snapshot = await getDocs(gpnCollectionRef);

  if (snapshot.empty) return null;

  // assuming one GPN account per user
  const docData = snapshot.docs[0].data();
  return docData.gpnId ?? null;
}
