import { db } from './firebaseConfig';
import { doc, deleteDoc } from 'firebase/firestore';

export const removeFriendService = async (relationshipId) => {
  await deleteDoc(doc(db, 'friends', relationshipId));
};