import { messaging } from '@/lib/firebase-config';
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';

// Standard VAPID key retrieval
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Requests notification permission and retrieves the FCM token.
 * This is a standard implementation without complex retry/cleanup logic.
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  console.log('🔔 Requesting notification permission...');

  if (!messaging) {
    console.warn('🚫 Firebase messaging is not initialized.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('✅ Notification permission granted.');

      if (!VAPID_KEY) {
        console.error('❌ Missing VAPID key in environment variables.');
        return null;
      }

      // Get the token directly
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      console.log('🔑 FCM Token obtained:', token ? 'Yes' : 'No');
      return token;

    } else {
      console.log('❌ Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return null;
  }
};

/**
 * Sets up a listener for foreground notifications.
 */
export const onMessageListener = (callback: (payload: MessagePayload) => void) => {
  if (!messaging) return;

  return onMessage(messaging, (payload) => {
    console.log('📨 Foreground message received:', payload);
    callback(payload);
  });
};

// Legacy support for existing code that might use this
export const setupForegroundNotifications = onMessageListener;