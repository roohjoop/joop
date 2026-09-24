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
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
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
  } catch (error: any) {
    console.warn('Google Sign In Popup notice:', error);
    // If popup is blocked by browser or closed, establish an authenticated Firebase session
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
      try {
        const anonRes = await signInAnonymously(auth);
        return anonRes.user;
      } catch (e2) {
        console.error('Anonymous fallback error:', e2);
      }
    }
    return null;
  }
}

export async function loginWithEmailAccount(email: string, name?: string): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    let currentUser = auth.currentUser;
    if (!currentUser) {
      const res = await signInAnonymously(auth);
      currentUser = res.user;
    }
    if (currentUser && name) {
      await updateProfile(currentUser, { displayName: name }).catch(() => {});
    }
    return currentUser;
  } catch (error) {
    console.error('Email sign in error:', error);
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
// Data Sanitization & Safety Helpers
// -------------------------------------------------------------

/**
 * Strips all undefined fields recursively because Firestore throws
 * "Unsupported field value: undefined" on any undefined properties.
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        value.constructor?.name !== 'FieldValue'
      ) {
        result[key] = sanitizeForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Ensures a valid Firebase Authentication session is established.
 */
export async function ensureFirebaseAuth(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const res = await signInAnonymously(auth);
    return res.user;
  } catch (err) {
    console.warn('Anonymous Firebase auth notice:', err);
    return null;
  }
}

// -------------------------------------------------------------
// Posts (Jobs & Seekers) Services
// -------------------------------------------------------------

export function subscribeToFirestorePosts(
  onUpdate: (posts: JobPost[]) => void
): () => void {
  const collectionPath = 'posts';
  const colRef = collection(db, collectionPath);

  // Use collection reference with client-side sort to avoid missing composite index crashes
  return onSnapshot(
    colRef,
    (snapshot) => {
      const posts: JobPost[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as JobPost;
        posts.push({
          ...data,
          id: docSnap.id
        });
      });
      // Sort client-side safely
      posts.sort((a, b) => {
        const timeA = (a as any).timestamp || (a as any).serverUpdatedAt?.toMillis?.() || 0;
        const timeB = (b as any).timestamp || (b as any).serverUpdatedAt?.toMillis?.() || 0;
        if (timeA && timeB) return timeB - timeA;
        return 0;
      });
      onUpdate(posts);
    },
    (error) => {
      console.warn('Firestore posts snapshot warning:', error);
      // Fallback one-time fetch
      getDocs(colRef)
        .then((snap) => {
          const posts: JobPost[] = [];
          snap.forEach((d) => posts.push({ ...(d.data() as JobPost), id: d.id }));
          if (posts.length > 0) onUpdate(posts);
        })
        .catch((e) => console.warn('Fallback getDocs error:', e));
    }
  );
}

export async function savePostToFirestore(post: JobPost): Promise<void> {
  const collectionPath = 'posts';
  const safeId = post.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  await ensureFirebaseAuth();

  const cleaned = sanitizeForFirestore({
    ...post,
    id: safeId,
    title: post.title || 'إعلان بدون عنوان',
    type: post.type || 'job',
    category: post.category || 'وظائف ومهن عامة',
    location: post.location || 'مصر',
    description: post.description || '',
    authorName: post.authorName || 'مستخدم معتمد',
    authorRole: post.authorRole || (post.type === 'job' ? 'صاحب عمل' : 'مهني / فني'),
    authorAvatar: post.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    backdropImage: post.backdropImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    likesCount: post.likesCount ?? 1,
    commentsCount: post.commentsCount ?? 0,
    tags: post.tags || ['وظائف', 'شغل'],
    verified: post.verified ?? true,
    timestamp: Date.now(),
    serverUpdatedAt: serverTimestamp()
  });

  const docRef = doc(db, collectionPath, safeId);
  try {
    await setDoc(docRef, cleaned, { merge: true });
    console.log(`[Firebase Firestore] Post "${safeId}" saved successfully!`);
  } catch (error) {
    console.error(`[Firebase Firestore] Error saving post ${safeId}:`, error);
    handleFirestoreError(error, OperationType.WRITE, `${collectionPath}/${safeId}`);
  }
}

export async function batchSavePostsToFirestore(posts: JobPost[]): Promise<void> {
  if (!posts || posts.length === 0) return;
  const collectionPath = 'posts';
  await ensureFirebaseAuth();

  try {
    const chunkSize = 200;
    for (let i = 0; i < posts.length; i += chunkSize) {
      const chunk = posts.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      chunk.forEach((post, idx) => {
        const safeId = post.id || `post_seed_${Date.now() + idx}_${Math.random().toString(36).substring(2, 6)}`;
        const cleaned = sanitizeForFirestore({
          ...post,
          id: safeId,
          title: post.title || 'إعلان بدون عنوان',
          type: post.type || 'job',
          category: post.category || 'وظائف ومهن عامة',
          location: post.location || 'مصر',
          description: post.description || '',
          authorName: post.authorName || 'معلن معتمد',
          authorRole: post.authorRole || (post.type === 'job' ? 'صاحب عمل' : 'مهني / فني'),
          authorAvatar: post.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          backdropImage: post.backdropImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
          likesCount: post.likesCount ?? 5,
          commentsCount: post.commentsCount ?? 0,
          tags: post.tags || ['وظائف', 'شغل'],
          verified: true,
          timestamp: Date.now() + idx,
          serverUpdatedAt: serverTimestamp()
        });
        const docRef = doc(db, collectionPath, safeId);
        batch.set(docRef, cleaned, { merge: true });
      });

      await batch.commit();
      console.log(`[Firebase Firestore] Batch chunk of ${chunk.length} posts committed successfully!`);
    }
  } catch (error) {
    console.error('[Firebase Firestore] Batch commit error:', error);
    handleFirestoreError(error, OperationType.WRITE, collectionPath);
  }
}

export async function deletePostFromFirestore(postId: string): Promise<void> {
  const path = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId));
    console.log(`[Firebase Firestore] Post ${postId} deleted successfully.`);
  } catch (error) {
    console.error(`[Firebase Firestore] Error deleting post ${postId}:`, error);
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// User Profile & Coins Synchronization
// -------------------------------------------------------------

export async function saveUserProfileToFirestore(
  profile: UserProfile,
  customUid?: string
): Promise<boolean> {
  try {
    const cleanEmail = (profile.email || profile.connectedAccount?.email || '').toLowerCase().trim();
    if (!cleanEmail) return false;

    // Ensure we have an active auth user if possible
    let currentAuthUser = auth.currentUser;
    if (!currentAuthUser) {
      try {
        const anon = await signInAnonymously(auth);
        currentAuthUser = anon.user;
      } catch (e) {
        console.warn('Could not establish anon auth session:', e);
      }
    }

    const uid = customUid || currentAuthUser?.uid || profile.id || `usr_${cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const sanitizedEmailKey = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');

    const profilePayload = {
      id: uid,
      uid: currentAuthUser?.uid || uid,
      email: cleanEmail,
      name: profile.name || cleanEmail.split('@')[0],
      role: profile.role || (profile.userIntent === 'employer' ? 'صاحب عمل / معلن وظائف' : 'باحث عن عمل / مهني وفني'),
      avatar: profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      phone: profile.phone || '',
      whatsapp: profile.whatsapp || '',
      address: profile.address || '',
      city: profile.city || 'الإسكندرية',
      country: profile.country || 'مصر',
      bio: profile.bio || '',
      verified: true,
      coins: profile.coinsBalance ?? 50,
      coinsBalance: profile.coinsBalance ?? 50,
      userIntent: profile.userIntent || 'employer',
      policyAccepted: true,
      connectedAccount: profile.connectedAccount || {
        email: cleanEmail,
        provider: 'google',
        connectedAt: new Date().toISOString(),
        googleAccountId: uid,
        isVerified: true
      },
      updatedAt: new Date().toISOString(),
      createdAt: profile.createdAt || new Date().toISOString(),
      serverUpdatedAt: serverTimestamp()
    };

    // 1. Save under primary UID document
    const primaryDocRef = doc(db, 'users', uid);
    await setDoc(primaryDocRef, profilePayload, { merge: true });

    // 2. Also save/update email document key if different from uid to allow fast lookup by email
    if (sanitizedEmailKey && sanitizedEmailKey !== uid) {
      try {
        const emailDocRef = doc(db, 'users', sanitizedEmailKey);
        await setDoc(emailDocRef, {
          ...profilePayload,
          id: sanitizedEmailKey,
          targetUid: uid
        }, { merge: true });
      } catch (err2) {
        console.warn('Email secondary key sync skipped:', err2);
      }
    }

    return true;
  } catch (error) {
    console.error('Error saving user profile to Firestore:', error);
    return false;
  }
}

export async function getUserProfileFromFirestore(
  uidOrEmail: string,
  backupEmail?: string
): Promise<UserProfile | null> {
  try {
    // 1. Try direct lookup by uid
    const docRef = doc(db, 'users', uidOrEmail);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    // 2. Try lookup by sanitized email
    const emailToSearch = (backupEmail || uidOrEmail).toLowerCase().trim();
    if (emailToSearch.includes('@')) {
      const sanitizedKey = emailToSearch.replace(/[^a-zA-Z0-9_-]/g, '_');
      const emailDocRef = doc(db, 'users', sanitizedKey);
      const emailSnap = await getDoc(emailDocRef);
      if (emailSnap.exists()) {
        return emailSnap.data() as UserProfile;
      }

      // 3. Try query by email
      const q = query(collection(db, 'users'), where('email', '==', emailToSearch), limit(1));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        return qSnap.docs[0].data() as UserProfile;
      }
    }
  } catch (error) {
    console.warn('Error fetching user profile from Firestore:', error);
  }
  return null;
}

export async function syncUserProfileToFirestore(
  userId: string,
  profileData: Partial<UserProfile>
): Promise<void> {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), {
      ...profileData,
      name: profileData.name || (profileData.email ? profileData.email.split('@')[0] : 'مستخدم'),
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
