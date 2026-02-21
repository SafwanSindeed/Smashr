import React, { useState, useMemo } from 'react';
import { useFriends } from '../hooks/useFriends'; // Similar to useBookings
import { removeFriendService } from '../services/friendService';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { toast } from 'react-hot-toast';

const FriendsPage = ({ currentUserId }) => {
  const { friends, loading } = useFriends(currentUserId);
  
  // State for the Search Bar
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for Sorting (A-Z or High DUPR) [cite: 99, 100]
  const [sortBy, setSortBy] = useState("name"); 
  
  // State for the Remove Friend Dialog
  const [removeTarget, setRemoveTarget] = useState(null);

  // Logic to Filter and Sort the list
  const processedFriends = useMemo(() => {
    // 1. Filter by name based on search bar
    let result = friends.filter(f => 
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Sort the result
    if (sortBy === 'name') {
      // Sort A to Z
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'dupr') {
      // Sort Highest DUPR to Lowest
      result.sort((a, b) => b.duprRating - a.duprRating);
    }
    return result;
  }, [friends, searchTerm, sortBy]);

  // Function to handle removing a friend
  const handleRemoveFriend = async () => {
    if (!removeTarget) return;
    try {
      await removeFriendService(removeTarget.relationshipId);
      toast.success(`${removeTarget.name} removed.`);
    } catch (e) {
      toast.error("Error removing friend.");
    } finally {
      setRemoveTarget(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Friends ({friends.length})</h1>
        
        {/* Sort Buttons [cite: 99, 100] */}
        <div className="flex gap-2">
          <button 
            onClick={() => setSortBy('name')}
            className={`px-3 py-1 rounded text-sm ${sortBy === 'name' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Sort A-Z
          </button>
          <button 
            onClick={() => setSortBy('dupr')}
            className={`px-3 py-1 rounded text-sm ${sortBy === 'dupr' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Highest DUPR
          </button>
        </div>
      </div>

      {/* Search Bar [cite: 98] */}
      <input 
        type="text"
        placeholder="Search friends by name..."
        className="w-full p-3 border rounded-lg mb-6"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Friends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processedFriends.map(friend => (
          // Friend Card [cite: 101]
          <div key={friend.id} className="border p-4 rounded-lg shadow-sm bg-white flex flex-col items-center text-center">
            
            {/* Avatar */}
            <div className="w-16 h-16 bg-gray-300 rounded-full mb-3 overflow-hidden">
               <img src={friend.avatar || '/default.png'} alt={friend.name} />
            </div>
            
            {/* Name and DUPR */}
            <h3 className="font-bold">{friend.name}</h3>
            <span className="text-sm bg-orange-100 text-orange-800 px-2 py-0.5 rounded mt-1">
              DUPR {friend.duprRating}
            </span>
            <p className="text-gray-500 text-xs mt-1">{friend.location}</p>
            
            {/* Buttons: Challenge or Remove [cite: 101] */}
            <div className="mt-4 flex gap-2 w-full">
              <button className="flex-1 bg-green-500 text-white py-1 rounded text-sm hover:bg-green-600">
                Challenge
              </button>
              <button 
                onClick={() => setRemoveTarget(friend)}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog for Removing Friend */}
      <ConfirmDialog 
        isOpen={!!removeTarget}
        title="Remove Friend"
        message={`Are you sure you want to remove ${removeTarget?.name}?`}
        onConfirm={handleRemoveFriend}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
};

export default FriendsPage;
