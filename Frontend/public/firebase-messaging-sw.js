// firebase-messaging-sw.js - Version: 2025-09-21T15:30:00Z
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

console.log('[firebase-messaging-sw.js] Service Worker version: 2025-09-21T15:30:00Z');

// Get Firebase config from build-time environment variables
// These should match the client-side configuration exactly
const firebaseConfig = {
  apiKey: "AIzaSyDGdX-7s_MDOmBWlz8I4Q10ezLrpZIf1cA",
  authDomain: "personal-fit-santa-fe.firebaseapp.com",
  projectId: "personal-fit-santa-fe",
  storageBucket: "personal-fit-santa-fe.firebasestorage.app",
  messagingSenderId: "152130733157",
  appId: "1:152130733157:web:33c48e3e46ba413667f28c",
  measurementId: "G-6YSYFJ4C5R"
};

console.log('[firebase-messaging-sw.js] Initializing Firebase with config:', {
  apiKey: firebaseConfig.apiKey?.substring(0, 20) + '...',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId?.substring(0, 20) + '...',
  measurementId: firebaseConfig.measurementId
});

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle skipWaiting message for immediate update
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('[firebase-messaging-sw.js] Skipping waiting and activating new service worker');
    self.skipWaiting();
  }
});

// Ensure the service worker takes control immediately
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle background messages según sección 4.1 del documento
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  // 🚨 CLAVE: Verificar si hay clientes activos/visibles antes de mostrar notificación
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      // Verificar si algún cliente está visible y enfocado
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && client.visibilityState === 'visible') {
          console.log('[firebase-messaging-sw.js] ❌ App is visible, NOT showing background notification');
          // Enviar mensaje al cliente para que maneje la notificación en primer plano
          client.postMessage({
            type: 'FOREGROUND_NOTIFICATION',
            payload: payload
          });
          return; // No mostrar notificación del service worker
        }
      }
      
      // Si llegamos aquí, la app no está visible, mostrar notificación (sección 4.1)
      console.log('[firebase-messaging-sw.js] ✅ App is hidden, showing background notification');
      
      // Usar notification payload si existe, sino crear desde data payload (sección 3.3)
      const notificationTitle = payload.notification?.title || 'Personal Fit Santa Fe';
      const notificationBody = payload.notification?.body || 'Nueva notificación';
      const notificationType = payload.data?.type || 'default';
      
      // 🚨 CLAVE: Usar tag único para evitar duplicados en móviles
      const uniqueTag = `pf_${notificationType}_${Date.now()}`;
      
      const notificationOptions = {
        body: notificationBody,
        icon: '/logo.png',
        badge: '/logo.png',
        image: payload.notification?.image,
        data: payload.data || {}, // Data payload para procesamiento (sección 3.3)
        tag: uniqueTag, // Tag único para evitar reemplazos
        requireInteraction: isImportantNotification(notificationType),
        actions: getNotificationActions(payload.data?.type),
        vibrate: [200, 100, 200],
        timestamp: Date.now(),
        // 🔧 Configuraciones adicionales para móviles
        silent: false,
        renotify: false // Evitar re-notificar la misma
      };

      console.log(`[firebase-messaging-sw.js] 📱 Showing notification with tag: ${uniqueTag}`);
      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
});

// Determina si una notificación es importante (sección 3.3 del documento)
function isImportantNotification(type) {
  const importantTypes = [
    'PAYMENT_EXPIRED',
    'PAYMENT_DUE_REMINDER',
    'ACTIVITY_CANCELLED'
  ];
  return importantTypes.includes(type);
}

// Get notification actions based on notification type (sección 4.3 del documento)
function getNotificationActions(type) {
  switch (type) {
    case 'ACTIVITY_REMINDER':
      return [
        { 
          action: 'view', 
          title: '👀 Ver Clase', 
          icon: '/logo.png' 
        }
      ];
    case 'PAYMENT_EXPIRED':
    case 'PAYMENT_DUE_REMINDER':
      return [
        { 
          action: 'pay', 
          title: '💳 Pagar Ahora', 
          icon: '/logo.png' 
        },
        { 
          action: 'remind', 
          title: '⏰ Recordar Después', 
          icon: '/logo.png' 
        }
      ];
    case 'BIRTHDAY':
      return [
        { 
          action: 'view', 
          title: '🎉 Ver', 
          icon: '/logo.png' 
        }
      ];
    case 'NEW_ACTIVITY':
      return [
        { 
          action: 'view', 
          title: '👀 Ver Actividades', 
          icon: '/logo.png' 
        }
      ];
    case 'GENERAL_ANNOUNCEMENT':
    default:
      return [
        { 
          action: 'view', 
          title: '👀 Ver', 
          icon: '/logo.png' 
        }
      ];
  }
}

// Handle notification clicks (sección 4.3 del documento)
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  const { type, activityId, paymentId, userId } = data;
  
  let urlToOpen = '/dashboard';
  let shouldOpenWindow = true;
  
  // Determinar URL según el tipo de notificación (sección 4.3)
  switch (action) {
    case 'view':
      if (type === 'ACTIVITY_REMINDER' && activityId) {
        urlToOpen = `/activities`;
      } else if (type === 'PAYMENT_EXPIRED' || type === 'PAYMENT_DUE_REMINDER') {
        urlToOpen = `/payments`;
      } else if (type === 'NEW_ACTIVITY') {
        urlToOpen = `/activities`;
      } else {
        urlToOpen = '/dashboard';
      }
      break;
      
    case 'pay':
      urlToOpen = '/payments';
      break;
      
    case 'remind':
      // Programar recordatorio - no abrir ventana
      console.log('Setting reminder for payment:', paymentId);
      shouldOpenWindow = false;
      break;
      
    default:
      // Click por defecto (sin botón de acción)
      switch (type) {
        case 'ACTIVITY_REMINDER':
        case 'NEW_ACTIVITY':
          urlToOpen = '/activities';
          break;
        case 'PAYMENT_EXPIRED':
        case 'PAYMENT_DUE_REMINDER':
          urlToOpen = '/payments';
          break;
        case 'BIRTHDAY':
          urlToOpen = '/dashboard';
          break;
        default:
          urlToOpen = '/dashboard';
      }
  }
  
  if (shouldOpenWindow) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Verificar si la app ya está abierta
          for (const client of clientList) {
            if (client.url.includes(self.location.origin)) {
              // Enfocar ventana existente y navegar
              client.focus();
              client.postMessage({
                type: 'NOTIFICATION_CLICK',
                action: action,
                url: urlToOpen,
                data: data
              });
              return;
            }
          }
          // Abrir nueva ventana si la app no está abierta
          return clients.openWindow(urlToOpen);
        })
    );
  }
});

console.log('[firebase-messaging-sw.js] ✅ Service Worker initialized according to FCM architecture document');