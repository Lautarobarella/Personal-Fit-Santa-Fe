// firebase-messaging-sw.js - Simplified Version
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDGdX-7s_MDOmBWlz8I4Q10ezLrpZIf1cA",
  authDomain: "personal-fit-santa-fe.firebaseapp.com",
  projectId: "personal-fit-santa-fe",
  storageBucket: "personal-fit-santa-fe.firebasestorage.app",
  messagingSenderId: "152130733157",
  appId: "1:152130733157:web:33c48e3e46ba413667f28c",
  measurementId: "G-6YSYFJ4C5R"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  // Extract title and body from either notification or data payload
  const title = payload.notification?.title || payload.data?.title || 'Personal Fit Santa Fe';
  const body = payload.notification?.body || payload.data?.body || 'Nueva notificación';
  const icon = '/logo.png';

  const notificationOptions = {
    body: body,
    icon: icon,
    badge: icon,
    data: payload.data, // Keep data for click handling
    tag: 'pf-notification' // Simple tag
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received');
  event.notification.close();

  const urlToOpen = '/dashboard'; // Default URL

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(focusedClient => {
              if (focusedClient) {
                focusedClient.postMessage({
                  type: 'NOTIFICATION_CLICK',
                  payload: event.notification.data
                });
              }
              return focusedClient;
            });
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});