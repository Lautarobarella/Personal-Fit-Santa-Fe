import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { messaging } from '@/lib/firebase-config';

export interface CustomNotificationPayload {
  notification?: {
    title?: string;
    body?: string;
    image?: string;
  };
  data?: Record<string, string>;
}

export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      console.warn('Firebase messaging not supported');
      return null;
    }

    if (typeof window === 'undefined') {
      return null;
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Get registration token
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error('VAPID key not found in environment variables');
        return null;
      }

      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey
      });

      if (currentToken) {
        console.log('Registration token obtained:', currentToken);
        return currentToken;
      } else {
        console.log('No registration token available');
        return null;
      }
    } else {
      console.log('Unable to get permission to notify');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
};

export const onMessageListener = (): Promise<MessagePayload> =>
  new Promise((resolve) => {
    if (!messaging) return;
    
    onMessage(messaging, (payload: MessagePayload) => {
      console.log('Foreground message received:', payload);
      resolve(payload);
    });
  });

export const setupForegroundNotifications = (
  callback: (payload: MessagePayload) => void
): (() => void) | void => {
  if (!messaging) return;

  const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
    console.log('Foreground notification received:', payload);
    callback(payload);
  });

  return unsubscribe;
};