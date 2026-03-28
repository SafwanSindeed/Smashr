import { useState, useEffect } from 'react';
import { subscribeToBookings } from '../services/bookingService';

export const useBookings = (userId) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToBookings(userId, (data) => {
      setBookings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { bookings, loading };
};