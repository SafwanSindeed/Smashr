import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

export const useBookings = (userId) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "users", userId, "bookings"),
      orderBy("registeredAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => {
        setBookings([]);
        setLoading(false);
      }
    );
    return unsub;
  }, [userId]);

  return { bookings, loading };
};
