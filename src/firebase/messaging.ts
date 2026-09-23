import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app, db, auth } from './config';
import { playCustomNotificationSound, dispatchPushNotification } from '../utils/notifications';

/**
 * Official Firebase Cloud Messaging (FCM) VAPID Web Push Key
 * Generated for project joop (gen-lang-client-0028535414)
 */
export const FCM_VAPID_KEY = 'BIqd87l7oJBw0R-3uLM-FGU1e2CJTW7u3Zg2X0syT6vFqHfpsB0cnX_eRtnZet-lww6ZYM8Pq7XxVECLmBd0O_I';

let messagingInstance: Messaging | null = null;
let currentFcmToken: string | null = null;

/**
 * Initializes Firebase Cloud Messaging and sets up foreground listener
 */
export async function initializeFCM(
  onForegroundNotification?: (payload: { title: string; body: string; data?: any }) => void
): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.info('[FCM] Firebase Messaging is not supported in this browser environment.');
      return null;
    }

    if (!messagingInstance) {
      messagingInstance = getMessaging(app);
    }

    // Register / verify the service worker for background push notifications
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        console.log('[FCM] Service Worker registered successfully:', swRegistration.scope);
      } catch (swErr) {
        console.warn('[FCM] Service Worker registration note:', swErr);
      }
    }

    // Check permission status
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('[FCM] Push Notification permission was not granted:', permission);
        return null;
      }
    }

    // Request registration token with the official VAPID key
    const token = await getToken(messagingInstance, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });

    if (token) {
      currentFcmToken = token;
      console.log('[FCM] Device registered successfully. Token:', token.substring(0, 15) + '...');
      
      // Save device token to Firestore for backend dispatch
      await saveFcmTokenToFirestore(token);

      // Listen for foreground push messages
      onMessage(messagingInstance, (payload) => {
        console.log('[FCM] Foreground push message received:', payload);
        
        const title = payload.notification?.title || payload.data?.title || 'شغل وتقنية | إشعار جديد';
        const body = payload.notification?.body || payload.data?.body || '';

        // Play custom harmonic chime sound
        playCustomNotificationSound();

        // Dispatch in-app system notification
        dispatchPushNotification({
          title,
          body,
          authorAvatar: payload.notification?.icon || '/icon.png',
          jobId: payload.data?.jobId
        });

        if (onForegroundNotification) {
          onForegroundNotification({ title, body, data: payload.data });
        }
      });

      return token;
    } else {
      console.warn('[FCM] No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (error) {
    console.warn('[FCM] An error occurred while retrieving FCM token:', error);
    return null;
  }
}

/**
 * Saves or updates FCM token in Firestore under collection 'fcmTokens'
 */
export async function saveFcmTokenToFirestore(token: string): Promise<void> {
  try {
    const user = auth.currentUser;
    const tokenDocRef = doc(db, 'fcmTokens', token.replace(/[/.]/g, '_'));
    await setDoc(
      tokenDocRef,
      {
        token,
        userId: user?.uid || 'guest',
        userEmail: user?.email || null,
        platform: 'web',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    // Non-fatal if firestore rule denies guest write
    console.debug('[FCM] Token persistence note:', err);
  }
}

/**
 * Returns the currently active FCM token if available
 */
export function getCurrentFcmToken(): string | null {
  return currentFcmToken;
}
