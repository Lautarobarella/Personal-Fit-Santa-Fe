import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const messaging = async () => {
    const supported = await isSupported();
    return supported ? getMessaging(app) : null;
};

export const getToken = async () => {
    const msg = await messaging();
    if (!msg) return null;

    const { getToken } = await import("firebase/messaging");

    try {
        return await getToken(msg, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
    } catch (error) {
        console.error("An error occurred while retrieving token. ", error);
        return null;
    }
};

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
