import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

/**
 * Firebase Configuration Object
 * 
 * Loads sensitive credentials from environment variables.
 * Usage of NEXT_PUBLIC prefix ensures these are available to the client-side bundle.
 */
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Safety Check: detailed error logging if critical config is missing
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("❌ Firebase configuration is missing. Check your .env file.");
    console.error("Required: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID");
}

/**
 * Initialize Firebase App
 * Validates if an instance already exists to prevent 'Firebase App named [DEFAULT] already exists' errors
 * which are common in Next.js hot-reloading environments.
 */
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Messaging Instance Provider
 * 
 * Asynchronously checks if the browser environment supports Firebase Messaging.
 * This is crucial because 'window' objects or Service Workers are not available during Server-Side Rendering (SSR).
 * 
 * @returns {Promise<Messaging | null>} The messaging instance or null if not supported.
 */
export const messaging = async () => {
    const supported = await isSupported();
    return supported ? getMessaging(app) : null;
};

/**
 * Get FCM Token
 * 
 * Retrieves the unique registration token for this client instance.
 * Uses the VAPID key to authenticate the request with the push service.
 * 
 * @returns {Promise<string | null>} The verified FCM token or null on failure.
 */
export const getToken = async () => {
    const msg = await messaging();
    if (!msg) {
        console.warn("⚠️ Messaging not supported or initialized (likely running on server or unsupported browser).");
        return null;
    }

    const { getToken } = await import("firebase/messaging");

    try {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error("❌ VAPID key is missing. Check NEXT_PUBLIC_FIREBASE_VAPID_KEY in .env");
            return null;
        }

        // Request the token from Firebase
        const token = await getToken(msg, { vapidKey });

        if (token) {
            return token;
        } else {
            console.warn("⚠️ No registration token available from Firebase service.");
            return null;
        }
    } catch (error) {
        console.error("❌ An error occurred while retrieving token:", error);
        return null;
    }
};

/**
 * Foreground Message Listener
 * 
 * Registers a callback to receive the notification payload when the app is in focus.
 * 
 * @returns {Promise<any>} Resolves with the message payload when a message arrives.
 */
export const onMessageListener = async () => {
    const msg = await messaging();
    if (!msg) return null;

    const { onMessage } = await import("firebase/messaging");

    return new Promise((resolve) => {
        onMessage(msg, (payload) => {
            resolve(payload);
        });
    });
};
