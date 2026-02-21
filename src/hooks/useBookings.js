import { useState, useEffect } from 'react';
import { subscribeToBookings } from '../services/bookingService';

// A custom hook to make using bookings easy in any page
export const useBookings = (userId) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    // Start the real-time listener
    const unsubscribe = subscribeToBookings(userId, (data) => {
      setBookings(data); // Update state with new data
      setLoading(false); // Stop showing the loading spinner
    });

    // Cleanup: Stop listening when the user leaves the page
    return () => unsubscribe();
  }, [userId]);

  return { bookings, loading };
};
