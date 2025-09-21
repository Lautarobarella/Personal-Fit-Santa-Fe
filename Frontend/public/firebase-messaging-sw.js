// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

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
  projectId: firebaseConfig.projectId,
  messagingSenderId: firebaseConfig.messagingSenderId
});

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'Personal Fit Santa Fe';
  const notificationOptions = {
    body: payload.notification?.body || 'Nueva notificación',
    icon: '/logo.png',
    badge: '/logo.png',
    image: payload.notification?.image,
    data: payload.data || {},
    tag: payload.data?.type || 'default',
    requireInteraction: true,
    actions: getNotificationActions(payload.data?.type),
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Get notification actions based on notification type
function getNotificationActions(type) {
  switch (type) {
    case 'class_reminder':
      return [
        { 
          action: 'view', 
          title: '👀 Ver Clase', 
          icon: '/icons/eye.png' 
        }
      ];
    case 'payment_due':
      return [
        { 
          action: 'pay', 
          title: '💳 Pagar Ahora', 
          icon: '/icons/payment.png' 
        },
        { 
          action: 'remind', 
          title: '⏰ Recordar Después', 
          icon: '/icons/clock.png' 
        }
      ];
    case 'general':
    default:
      return [
        { 
          action: 'view', 
          title: '👀 Ver', 
          icon: '/icons/eye.png' 
        }
      ];
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  const { type, activityId, paymentId, userId } = data;
  
  let urlToOpen = '/dashboard';
  let shouldOpenWindow = true;
  
  // Handle different actions
  switch (action) {
    case 'confirm':
      if (type === 'class_reminder' && activityId) {
        // Confirm attendance via API
        handleConfirmAttendance(activityId);
        shouldOpenWindow = false;
      }
      break;
      
    case 'view':
      if (type === 'class_reminder' && activityId) {
        urlToOpen = `/activities/${activityId}`;
      } else if (type === 'payment_due' && paymentId) {
        urlToOpen = `/payments/${paymentId}`;
      } else {
        urlToOpen = '/dashboard';
      }
      break;
      
    case 'pay':
      if (paymentId) {
        urlToOpen = `/payments/${paymentId}`;
      } else {
        urlToOpen = '/payments';
      }
      break;
      
    case 'enroll':
      if (activityId) {
        handleEnrollInActivity(activityId);
        urlToOpen = `/activities/${activityId}`;
      }
      break;
      
    case 'alternatives':
      urlToOpen = '/activities';
      break;
      
    case 'contact':
      urlToOpen = '/settings';
      break;
      
    case 'remind':
      // Schedule a reminder for later
      handleRemindLater(paymentId);
      shouldOpenWindow = false;
      break;
      
    default:
      // Default click (no action button)
      if (type === 'class_reminder' && activityId) {
        urlToOpen = `/activities/${activityId}`;
      } else if (type === 'payment_due' && paymentId) {
        urlToOpen = `/payments/${paymentId}`;
      } else {
        urlToOpen = '/dashboard';
      }
  }
  
  if (shouldOpenWindow) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin)) {
              // Focus existing window and navigate
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
          // Open new window if app is not open
          return clients.openWindow(urlToOpen);
        })
    );
  }
});

// Handle remind later
function handleRemindLater(paymentId) {
  // In a real implementation, you might want to schedule a notification
  // or update user preferences via an API call
  console.log('Setting reminder for payment:', paymentId);
  
  self.registration.showNotification('⏰ Recordatorio Programado', {
    body: 'Te recordaremos sobre el pago más tarde',
    icon: '/logo.png',
    tag: 'reminder_set',
    requireInteraction: false
  });
}