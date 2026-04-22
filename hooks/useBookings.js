import { useState, useEffect } from 'react';
import {
  getUserInfoByEmailTest,
  getUsersTournamentsByUserIdTest,
} from '../services/bookingService';

export const useBookings = (userId) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      console.log('useBookings started, userId =', userId);

      try {
        if (!userId) {
          console.log('No userId');
          setBookings([]);
          setLoading(false);
          return;
        }

        const userInfo = await getUserInfoByEmailTest('nealbbayla@gmail.com');
        console.log('GPN user info:', userInfo);

        if (!userInfo?.id) {
          console.log('No GPN user id found');
          setBookings([]);
          return;
        }

        const data = await getUsersTournamentsByUserIdTest(userInfo.id);
        console.log("GPN user's tournaments data:", data);

        if (Array.isArray(data)) {
          setBookings(data);
        } else if (data?.status === 'fail') {
          console.log('No current tournaments:', data.message);
          setBookings([]);
        } else {
          console.log('User tournaments format not recognized:', data);
          setBookings([]);
        }
      } catch (error) {
        console.log('useBookings error:', error);
        setBookings([]);
      } finally {
        console.log('useBookings finished');
        setLoading(false);
      }
    };

    loadBookings();
  }, [userId]);

  return { bookings, loading };
};