import React from 'react';

const BookingCard = ({ booking, onEdit, onCancel, onViewDetails }) => {
  // Check if this booking is for a Tournament or a Verse Battle (1v1)
  const isTournament = booking.type === 'tournament';
  
  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white mb-4 flex justify-between items-center">
      {/* Click here to see full details */}
      <div onClick={() => onViewDetails(booking.bookingId)} className="cursor-pointer flex-1">
        
        <div className="flex items-center gap-2 mb-1">
          {/* Show Tournament Name OR Opponent Name */}
          <h3 className="font-bold text-lg">
            {isTournament ? booking.tournamentName : booking.opponentName}
          </h3>
          
          {/* Only show DUPR rating if it is a Verse Battle [cite: 108] */}
          {!isTournament && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 rounded">
              DUPR {booking.opponentDupr}
            </span>
          )}
          
          {/* Status Badge (Confirmed/Pending) */}
          <span className={`text-xs px-2 py-1 rounded ${
            booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
          }`}>
            {booking.status}
          </span>
        </div>
        
        <div className="text-gray-500 text-sm">
          <p>📅 {booking.date} • ⏰ {booking.time}</p>
          <p>📍 {booking.location}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button onClick={() => onEdit(booking)} className="text-blue-600 hover:underline text-sm">
          Edit
        </button>
        <button 
          onClick={() => onCancel(booking)} 
          className="text-red-500 hover:underline text-sm border border-red-500 px-3 py-1 rounded"
        >
          Cancel Booking
        </button>
      </div>
    </div>
  );
};

export default BookingCard;
