import React, { useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import { cancelBookingService } from '../services/bookingService';
import BookingCard from '../components/bookings/BookingCard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { toast } from 'react-hot-toast'; // Used for pop-up notifications

const MyBookingsPage = ({ currentUserId }) => {
  // Get data using our custom hook
  const { bookings, loading } = useBookings(currentUserId);
  
  // State to track which tab is open (Verse Battles or Tournaments)
  const [activeTab, setActiveTab] = useState('verse'); 
  
  // State to track which booking user wants to cancel
  const [cancelTarget, setCancelTarget] = useState(null);

  // Filter the list based on the active tab
  const filteredBookings = bookings.filter(b => 
    activeTab === 'verse' ? b.type === 'verse' : b.type === 'tournament'
  );

  // Function to handle the actual cancellation
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      // Call the service to update Firestore
      await cancelBookingService(cancelTarget.bookingId);
      toast.success("Booking cancelled!");
      // The list updates automatically because of useBookings hook
    } catch (error) {
      toast.error("Failed to cancel.");
    } finally {
      // Close the dialog
      setCancelTarget(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {/* Tabs Section */}
      <div className="flex border-b mb-6">
        <button 
          className={`px-4 py-2 ${activeTab === 'verse' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('verse')}
        >
          Verse Battles
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'tournament' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('tournament')}
        >
          Tournaments
        </button>
      </div>

      {/* List Section */}
      {loading ? (
        <p>Loading...</p>
      ) : filteredBookings.length > 0 ? (
        filteredBookings.map(booking => (
          <BookingCard 
            key={booking.bookingId} 
            booking={booking} 
            // When clicked, save this booking to state to open the dialog
            onCancel={(b) => setCancelTarget(b)}
            onEdit={(b) => console.log("Edit:", b)}
            onViewDetails={(id) => console.log("Details:", id)}
          />
        ))
      ) : (
        <div className="text-center py-10 text-gray-500">No bookings found.</div>
      )}

      {/* Popup Dialog for Cancellation */}
      <ConfirmDialog 
        isOpen={!!cancelTarget}
        title="Cancel Booking"
        message={`Do you really want to cancel the match at ${cancelTarget?.location}?`}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
};

export default MyBookingsPage;
