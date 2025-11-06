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

    // Force service worker update and registration
    try {
      // Clean up ALL existing service workers to prevent conflicts
      console.log('🧹 Cleaning up existing service workers...');
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      
      if (existingRegistrations.length > 0) {
        console.log(`Found ${existingRegistrations.length} existing service worker(s)`);
        
        for (const registration of existingRegistrations) {
          const scriptURL = registration.active?.scriptURL || 
                           registration.installing?.scriptURL || 
                           registration.waiting?.scriptURL || 'Unknown';
          
          console.log(`�️ Unregistering service worker: ${scriptURL}`);
          
          try {
            await registration.unregister();
          } catch (unregisterError) {
            console.warn('⚠️ Failed to unregister service worker:', unregisterError);
          }
        }

        // Wait longer for cleanup to complete
        console.log('⏳ Waiting for cleanup to complete...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('✅ No existing service workers to clean up');
      }

      // Register fresh Firebase service worker
      console.log('📝 Registering new Firebase service worker...');
      const timestamp = Date.now();
      
      // Clear any cached service worker first
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => 
              cacheName.includes('workbox') || cacheName.includes('firebase') 
                ? caches.delete(cacheName) 
                : Promise.resolve()
            )
          );
          console.log('🧹 Cleared service worker caches');
        } catch (cacheError) {
          console.warn('⚠️ Failed to clear caches:', cacheError);
        }
      }
      
      const registration = await navigator.serviceWorker.register(
        `/firebase-messaging-sw.js?v=${timestamp}&bustCache=${Math.random()}`, 
        {
          scope: '/',
          updateViaCache: 'none'
        }
      );
      
      console.log('✅ Service worker registration successful');

      // Wait for activation with better null handling
      if (registration.installing) {
        console.log('⏳ Waiting for service worker to install...');
        await new Promise<void>(resolve => {
          const sw = registration.installing!;
          const handleStateChange = () => {
            // Check if sw still exists and has the expected state
            if (sw && sw.state === 'installed') {
              resolve();
            } else if (sw && sw.state === 'activated') {
              resolve();
            } else if (!sw || sw.state === 'redundant') {
              // If service worker becomes null or redundant, still resolve
              console.warn('⚠️ Service worker became null or redundant during installation');
              resolve();
            }
          };
          
          sw.addEventListener('statechange', handleStateChange);
          
          // Fallback timeout to prevent hanging
          setTimeout(() => {
            console.log('⏰ Service worker installation timeout - continuing anyway');
            resolve();
          }, 5000);
        });
      }

      // Take immediate control
      await navigator.serviceWorker.ready;
      console.log('✅ Firebase service worker registered and ready');

      // Force activation if needed
      if (registration.waiting) {
        console.log('🚀 Activating waiting service worker...');
        registration.waiting.postMessage({ action: 'skipWaiting' });
        await new Promise(resolve => setTimeout(resolve, 500));
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
      
      try {
        const currentToken = await getToken(messaging, {
          vapidKey: vapidKey
        });
        
        if (currentToken) {
          console.log('✅ FCM registration token obtained:', currentToken.substring(0, 20) + '...');
          return currentToken;
        } else {
          console.error('❌ No registration token available');
          throw new Error('No FCM token available');
        }
        
      } catch (tokenError: any) {
        console.error('❌ Error getting FCM token:', tokenError);
        
        // Provide specific error messages based on error type
        if (tokenError.code === 'messaging/failed-service-worker-registration') {
          throw new Error('Service Worker registration failed for FCM. Please check your service worker configuration.');
        } else if (tokenError.code === 'messaging/permission-blocked') {
          throw new Error('Notification permission was blocked. Please enable notifications in your browser settings.');
        } else if (tokenError.code === 'messaging/vapid-key-required') {
          throw new Error('VAPID key configuration error. Please check your Firebase configuration.');
        } else if (tokenError.message?.includes('service worker')) {
          throw new Error('Service Worker issue detected. Try refreshing the page or clearing your browser cache.');
        } else {
          throw new Error(`FCM token error: ${tokenError.message || 'Unknown error'}`);
        }
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