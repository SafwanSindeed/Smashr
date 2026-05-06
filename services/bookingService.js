// services/bookingService.js
import { db } from './firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';

const GPN_BASE = 'https://www.globalpickleball.network/component/api';
const GPN_DEV_KEY = '264784-q4jMNhO3X';

export const subscribeToBookings = (userId, callback) => {
  const q = query(collection(db, 'bookings'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((docItem) => ({
      bookingId: docItem.id,
      ...docItem.data(),
    }));
    callback(bookings);
  });
};

export const cancelBookingService = async (bookingId) => {
  const bookingRef = doc(db, 'bookings', bookingId);
  await updateDoc(bookingRef, { status: 'cancelled' });
};

export const getTournamentsTest = async () => {
  const url = `${GPN_BASE}?apiCall=getTournaments&format=raw&devKey=${GPN_DEV_KEY}&start=0&limit=10`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
};

export const getUserInfoByEmailTest = async (email) => {
  const url = `${GPN_BASE}?apiCall=getUserInfo&format=raw&devKey=${GPN_DEV_KEY}&email=${encodeURIComponent(email)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const getUsersTournamentsByUserIdTest = async (userID) => {
  const url = `${GPN_BASE}?apiCall=getUsersTournaments&format=raw&devKey=${GPN_DEV_KEY}&userID=${encodeURIComponent(userID)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
};
