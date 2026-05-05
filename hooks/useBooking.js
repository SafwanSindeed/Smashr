// hooks/useBooking.js
import { useState, useEffect } from "react";
import {
  getUserInfoByEmailTest,
  getUsersTournamentsByUserIdTest,
} from "../services/bookingService";
import { auth } from "../services/firebaseConfig";

export const useBookings = (userId) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        if (!userId) {
          setBookings([]);
          setLoading(false);
          return;
        }

        const email = auth.currentUser?.email;
        if (!email) {
          setBookings([]);
          setLoading(false);
          return;
        }

        const userInfo = await getUserInfoByEmailTest(email);
        if (!userInfo?.id) {
          setBookings([]);
          return;
        }

        const data = await getUsersTournamentsByUserIdTest(userInfo.id);

        if (Array.isArray(data)) {
          setBookings(data);
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.log("useBookings error:", error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [userId]);

  return { bookings, loading };
};
