import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from './config';
import { JobPost, UserProfile } from '../types';
import { SupportTicket, SupportChatMessage } from '../utils/supportManager';

// -------------------------------------------------------------
// Authentication
// -------------------------------------------------------------

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In Error:', error);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
  }
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// -------------------------------------------------------------
// Posts (Jobs & Seekers) Services
// -------------------------------------------------------------

export function subscribeToFirestorePosts(
  onUpdate: (posts: JobPost[]) => void
): () => void {
  const collectionPath = 'posts';
  const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const posts: JobPost[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as JobPost;
        posts.push({
          ...data,
          id: docSnap.id
        });
      });
      onUpdate(posts);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

export async function savePostToFirestore(post: JobPost): Promise<void> {
  const collectionPath = 'posts';
  const docRef = doc(db, collectionPath, post.id);
  try {
    await setDoc(docRef, {
      ...post,
      serverUpdatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionPath}/${post.id}`);
  }
}

export async function batchSavePostsToFirestore(posts: JobPost[]): Promise<void> {
  const collectionPath = 'posts';
  try {
    const batch = writeBatch(db);
    posts.forEach((post) => {
      const docRef = doc(db, collectionPath, post.id);
      batch.set(docRef, {
        ...post,
        serverUpdatedAt: serverTimestamp()
      }, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionPath);
  }
}

export async function deletePostFromFirestore(postId: string): Promise<void> {
  const path = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// User Profile & Coins Synchronization
// -------------------------------------------------------------

export async function syncUserProfileToFirestore(
  userId: string,
  profileData: Partial<UserProfile>
): Promise<void> {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), {
      ...profileData,
      updatedAt: new Date().toISOString(),
      serverUpdatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profile: Partial<UserProfile>) => void
): () => void {
  const path = `users/${userId}`;
  return onSnapshot(
    doc(db, 'users', userId),
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as Partial<UserProfile>);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// -------------------------------------------------------------
// Support Tickets Services (With Email Isolation)
// -------------------------------------------------------------

export function subscribeToUserSupportTickets(
  userEmail: string,
  onUpdate: (tickets: SupportTicket[]) => void
): () => void {
  const collectionPath = 'support_tickets';
  // Strict query filter matching user email for privacy isolation
  const q = query(
    collection(db, collectionPath),
    where('userEmail', '==', userEmail.trim().toLowerCase()),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tickets: SupportTicket[] = [];
      snapshot.forEach((docSnap) => {
        tickets.push(docSnap.data() as SupportTicket);
      });
      onUpdate(tickets);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

export function subscribeToAllSupportTickets(
  onUpdate: (tickets: SupportTicket[]) => void
): () => void {
  const collectionPath = 'support_tickets';
  const q = query(collection(db, collectionPath), orderBy('updatedAt', 'desc'), limit(150));

  return onSnapshot(
    q,
    (snapshot) => {
      const tickets: SupportTicket[] = [];
      snapshot.forEach((docSnap) => {
        tickets.push(docSnap.data() as SupportTicket);
      });
      onUpdate(tickets);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

export async function saveSupportTicketToFirestore(ticket: SupportTicket): Promise<void> {
  const path = `support_tickets/${ticket.id}`;
  try {
    await setDoc(doc(db, 'support_tickets', ticket.id), {
      ...ticket,
      userEmail: ticket.userEmail.trim().toLowerCase(),
      serverUpdatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Comments Synchronization
// -------------------------------------------------------------

export interface FirestoreComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export function subscribeToPostComments(
  postId: string,
  onUpdate: (comments: FirestoreComment[]) => void
): () => void {
  const collectionPath = 'comments';
  const q = query(
    collection(db, collectionPath),
    where('postId', '==', postId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: FirestoreComment[] = [];
      snapshot.forEach((d) => list.push(d.data() as FirestoreComment));
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

export async function addCommentToFirestore(comment: FirestoreComment): Promise<void> {
  const path = `comments/${comment.id}`;
  try {
    await setDoc(doc(db, 'comments', comment.id), {
      ...comment,
      serverCreatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
