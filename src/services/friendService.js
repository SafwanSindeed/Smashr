import { db } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

// Function to remove a friend connection from the database
export const removeFriendService = async (relationshipId) => {
  // Delete the document that links these two friends
  await deleteDoc(doc(db, "friends", relationshipId));
};
