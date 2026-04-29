import { db } from './firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';

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

const GPN_BASE = 'https://www.globalpickleball.network/component/api';
const GPN_DEV_KEY = '264784-q4jMNhO3X';

export const getTournamentsTest = async () => {
  const url = `${GPN_BASE}?apiCall=getTournaments&format=raw&devKey=${GPN_DEV_KEY}&start=0&limit=10`;

  console.log('GPN request url:', url);

  const res = await fetch(url);

  console.log('GPN response status:', res.status);

  const text = await res.text();
  console.log('GPN raw response text:', text);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  try {
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.log('JSON parse failed');
    return [];
  }
};

export const getUserInfoByEmailTest = async (email) => {
  const url = `${GPN_BASE}?apiCall=getUserInfo&format=raw&devKey=${GPN_DEV_KEY}&email=${encodeURIComponent(email)}`;

  console.log('Get user info url:', url);

  const res = await fetch(url);

  console.log('Get user info status:', res.status);

  const text = await res.text();
  console.log('Get user info raw response:', text);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.log('Get user info JSON parse failed');
    return null;
  }
};

export const getUsersTournamentsByUserIdTest = async (userID) => {
  const url = `${GPN_BASE}?apiCall=getUsersTournaments&format=raw&devKey=${GPN_DEV_KEY}&userID=${encodeURIComponent(userID)}`;

  console.log("Get user's tournaments url:", url);

  const res = await fetch(url);

  console.log("Get user's tournaments status:", res.status);

  const text = await res.text();
  console.log("Get user's tournaments raw response:", text);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.log("Get user's tournaments JSON parse failed");
    return [];
  }
};