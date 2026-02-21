import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

// Function to listen for changes in the user's bookings
export const subscribeToBookings = (userId, callback) => {
  // 1. Create a query: Find bookings where "userId" matches the current user
  const q = query(collection(db, "bookings"), where("userId", "==", userId));
  
  // 2. Start listening. Firebase runs this every time data changes.
  const unsubscribe = onSnapshot(q, (snapshot) => {
    // 3. Convert the data into a clean list
    const bookings = snapshot.docs.map(doc => ({
      bookingId: doc.id,
      ...doc.data()
    }));
    // 4. Send the list back to the component
    callback(bookings);
  });
  
  // 5. Return a function to stop listening (cleanup)
  return unsubscribe;
};

// Function to cancel a booking
export const cancelBookingService = async (bookingId) => {
  // Find the specific booking document
  const bookingRef = doc(db, "bookings", bookingId);
  
  // Update the status to 'cancelled' (Soft Delete)
  await updateDoc(bookingRef, { status: "cancelled" });
};
