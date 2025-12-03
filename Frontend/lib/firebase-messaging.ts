import { messaging } from '@/lib/firebase-config';
import { getToken, MessagePayload, onMessage, Messaging } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging as getFirebaseMessaging } from 'firebase/messaging';

export interface CustomNotificationPayload {
  notification?: {
    title?: string;
    body?: string;
    image?: string;
  };
  data?: Record<string, string>;
}

/**
 * Función utilitaria para limpiar todos los service workers
 * Útil para resolver problemas de service workers redundantes
 */
export const cleanupServiceWorkers = async (): Promise<void> => {
  try {
    if ('serviceWorker' in navigator) {
      console.log('🧹 Starting cleanup of all service workers...');

      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`Found ${registrations.length} service worker(s) to clean up`);

      for (const registration of registrations) {
        const scriptURL = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL;
        console.log(`🗑️ Unregistering: ${scriptURL}`);
        await registration.unregister();
      }

      console.log('✅ All service workers cleaned up successfully');
      console.log('💡 Please refresh the page to register a fresh service worker');
    } else {
      console.warn('Service workers not supported in this browser');
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

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

    // Request permission first
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('✅ Notification permission granted');

      // Register Service Worker if not already registered
      try {
        const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        if (!registration) {
          console.log('📝 Registering Firebase service worker...');
          await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });
          console.log('✅ Service worker registered');
        } else {
          console.log('✅ Service worker already registered');
        }

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
      } catch (swError) {
        console.error('❌ Service worker registration error:', swError);
        // Continue anyway, maybe it was registered by pwa-notification-provider
      }

      // Get registration token
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error('❌ VAPID key not found in environment variables');
        throw new Error('VAPID key configuration missing');
      }

      console.log('🔑 Using VAPID key:', vapidKey.substring(0, 20) + '...');

      try {
        // Get token with simple retry logic
        let currentToken = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (!currentToken && attempts < maxAttempts) {
          attempts++;
          console.log(`🔄 Attempting to get FCM token (attempt ${attempts}/${maxAttempts})`);

          try {
            currentToken = await getToken(messaging, {
              vapidKey: vapidKey
            });

            if (currentToken) {
              console.log('✅ FCM registration token obtained:', currentToken.substring(0, 20) + '...');
              return currentToken;
            }
          } catch (attemptError: any) {
            console.warn(`⚠️ Attempt ${attempts} failed:`, attemptError.message);

            if (attempts < maxAttempts) {
              console.log('⏳ Waiting before retry...');
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
          }
        }

        console.error('❌ No registration token available after all attempts');
        throw new Error('No FCM token available after retries');

      } catch (tokenError: any) {
        console.error('❌ Error getting FCM token:', tokenError);
        throw tokenError;
      }
    } else {
      console.log('❌ Permission denied:', permission);
      throw new Error('Notification permission denied');
    }
  } catch (error) {
    console.error('❌ Error in requestNotificationPermission:', error);
    throw error;
  }
};

export const setupForegroundNotifications = (
  callback: (payload: MessagePayload) => void
): (() => void) | void => {
  if (!messaging) return;

  console.log('🔧 Setting up foreground notifications listener...');

  const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
    console.log('🔥 Foreground notification received:', payload);

    // 🚨 CLAVE: Solo manejar notificaciones en primer plano si la app está visible
    // Esto evita duplicados con el service worker en background
    if (typeof document !== 'undefined') {
      const isVisible = document.visibilityState === 'visible';
      const hasFocus = document.hasFocus();

      console.log(`📱 App visibility: ${document.visibilityState}, has focus: ${hasFocus}`);

      if (isVisible && hasFocus) {
        console.log('✅ App is visible and focused, handling foreground notification');
        callback(payload);
      } else {
        console.log('❌ App is hidden or unfocused, letting service worker handle notification');
      }
    } else {
      console.log('❌ Document not available, letting service worker handle notification');
    }
  });

  return unsubscribe;
};

// ===============================
// FUNCIONES NUEVAS PARA EL DOCUMENTO FCM
// ===============================

/**
 * Inicializa Firebase (usado por el nuevo NotificationsProvider)
 */
export const initializeFirebase = async (): Promise<void> => {
  // Firebase ya se inicializa en firebase-config, esta función es para compatibilidad
  if (getApps().length === 0) {
    throw new Error('Firebase not initialized in firebase-config')
  }
  console.log('✅ Firebase already initialized')
}

/**
 * Obtiene la instancia de Messaging (usado por el nuevo NotificationsProvider)
 */
export const getMessaging = async (): Promise<Messaging | null> => {
  return messaging
}

/**
 * Versión simplificada de onMessageListener que acepta callback
 * Implementa la sección 4.2 del documento
 */
export const onMessageListener = (callback: (payload: MessagePayload) => void): void => {
  if (!messaging) return;

  onMessage(messaging, (payload: MessagePayload) => {
    console.log('📱 Foreground notification received:', payload);

    // Solo manejar si la app está visible y enfocada (sección 4.2)
    if (typeof document !== 'undefined') {
      const isVisible = document.visibilityState === 'visible';
      const hasFocus = document.hasFocus();

      if (isVisible && hasFocus) {
        callback(payload);
      }
    }
  });
}