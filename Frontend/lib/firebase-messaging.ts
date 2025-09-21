import { messaging } from '@/lib/firebase-config';
import { getToken, MessagePayload, onMessage } from 'firebase/messaging';

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

    // Force service worker update and registration
    try {
      // First, try to unregister any existing service worker
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of existingRegistrations) {
        if (registration.active?.scriptURL.includes('firebase-messaging-sw.js')) {
          console.log('� Unregistering old service worker...');
          await registration.unregister();
        }
      }

      // Register fresh service worker with cache-busting
      const timestamp = Date.now();
      const registration = await navigator.serviceWorker.register(
        `/firebase-messaging-sw.js?t=${timestamp}`, 
        {
          scope: '/',
          updateViaCache: 'none' // Prevent caching of the service worker script
        }
      );

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Firebase service worker registered and ready');

      // Force update if there's a waiting service worker
      if (registration.waiting) {
        registration.waiting.postMessage({ action: 'skipWaiting' });
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
      console.log('🔑 Full VAPID key for debugging:', vapidKey);

      // Log Firebase configuration for debugging
      console.log('🔧 Firebase client config:', {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.substring(0, 20) + '...'
      });

      console.log('🔧 About to call getToken with VAPID key...');
      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey
      });

      if (currentToken) {
        console.log('✅ Registration token obtained:', currentToken.substring(0, 20) + '...');
        return currentToken;
      } else {
        console.log('⚠️ No registration token available - possible causes:');
        console.log('  - Service worker Firebase config mismatch');
        console.log('  - VAPID key not associated with this project');
        console.log('  - Firebase project configuration issue');
        console.log('  - Network/firewall blocking Firebase services');
        throw new Error('No registration token available');
      }
    } else {
      console.log('❌ Permission denied:', permission);
      throw new Error('Notification permission denied');
    }
  } catch (error) {
    console.error('❌ Error in requestNotificationPermission:', error);
    
    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (error.name === 'AbortError' || errorMessage.includes('registration failed')) {
        console.error('🔍 AbortError details:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 3)
        });
        throw new Error('Error de configuración de Firebase. Es posible que las claves VAPID no coincidan entre el cliente y el Service Worker.');
      } else if (errorMessage.includes('vapid')) {
        throw new Error('Error de configuración VAPID. Verifica que la clave VAPID esté correctamente configurada.');
      } else if (errorMessage.includes('denied')) {
        throw new Error('Permisos de notificación denegados. Puedes habilitarlos en la configuración del navegador.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        throw new Error('Error de red. Verifica tu conexión a internet.');
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