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
      console.warn('🚫 Firebase messaging not supported - check firebase-config.js');
      return null;
    }

    if (typeof window === 'undefined') {
      console.warn('🚫 Window is undefined - SSR context');
      return null;
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('🚫 This browser does not support notifications');
      return null;
    }

    // Check service worker support
    if (!('serviceWorker' in navigator)) {
      console.warn('🚫 Service Worker not supported');
      return null;
    }

    // Verify service worker is registered
    try {
      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!registration) {
        console.warn('🚫 Firebase service worker not registered');
        // Try to register it
        await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        console.log('✅ Firebase service worker registered');
      }
    } catch (swError) {
      console.error('❌ Service worker registration error:', swError);
      throw new Error('Service Worker registration failed');
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      
      // Get registration token
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error('❌ VAPID key not found in environment variables');
        throw new Error('VAPID key configuration missing');
      }

      console.log('🔑 Using VAPID key:', vapidKey.substring(0, 20) + '...');

      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey
      });

      if (currentToken) {
        console.log('✅ Registration token obtained:', currentToken.substring(0, 20) + '...');
        return currentToken;
      } else {
        console.log('⚠️ No registration token available - possible causes:');
        console.log('  - Service worker not properly registered');
        console.log('  - VAPID key mismatch');
        console.log('  - Firebase project configuration issue');
        throw new Error('No registration token available');
      }
    } else {
      console.log('❌ Permission denied:', permission);
      throw new Error('Notification permission denied');
    }
  } catch (error) {
    console.error('❌ Error in requestNotificationPermission:', error);
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Registration failed')) {
        throw new Error('Error de registro del Service Worker. Verifica la configuración de Firebase.');
      } else if (error.message.includes('VAPID')) {
        throw new Error('Error de configuración VAPID. Contacta al administrador.');
      } else if (error.message.includes('denied')) {
        throw new Error('Permisos de notificación denegados. Puedes habilitarlos en la configuración del navegador.');
      }
    }
    throw new Error(`Error al configurar notificaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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