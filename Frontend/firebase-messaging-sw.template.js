// Firebase Cloud Messaging Service Worker Template
// This template is used to generate the actual service worker with .env values

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Config injected from .env at build time
firebase.initializeApp({
    apiKey: "{{NEXT_PUBLIC_FIREBASE_API_KEY}}",
    authDomain: "{{NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}}",
    projectId: "{{NEXT_PUBLIC_FIREBASE_PROJECT_ID}}",
    storageBucket: "{{NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}}",
    messagingSenderId: "{{NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}}",
    appId: "{{NEXT_PUBLIC_FIREBASE_APP_ID}}",
    measurementId: "{{NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}}"
});

const messaging = firebase.messaging();



// Handle background messages
messaging.onBackgroundMessage((payload) => {


    const notificationTitle = payload.notification?.title || 'Nueva Notificación';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'notification-' + Date.now(),
        requireInteraction: false,
        data: payload.data
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {


    event.notification.close();

    // Open the app when notification is clicked
    event.waitUntil(
        clients.openWindow('/')
    );
});
