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