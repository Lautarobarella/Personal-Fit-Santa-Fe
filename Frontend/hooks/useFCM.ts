"use client"

import { useEffect, useState } from "react";
import { getToken, onMessageListener } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-provider";
import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { toast } from "sonner";

/**
 * useFCM Hook
 * 
 * A custom React hook for handling Firebase Cloud Messaging (FCM) integration 
 * in the frontend application.
 * 
 * Core Functionalities:
 * 1. Service Worker Registration: Registers the background worker for push notifications.
 * 2. Permission Management: Requests user permission for notifications.
 * 3. Token Generation: Retreives the unique FCM device token.
 * 4. Token Synchronization: Sends the token to the backend to associate it with the logged-in user.
 * 5. Formatting Notifications: Listens for foreground messages and displays them via toasts.
 * 
 * @returns {object} { fcmToken: string | null } - The current FCM token for the device.
 */
export function useFCM() {
    const { user } = useAuth();
    const [fcmToken, setFcmToken] = useState<string | null>(null);

    /**
     * Effect: Register Service Worker
     * 
     * Registers the 'firebase-messaging-sw.js' service worker file. 
     * This file is critical for handling background notifications (when the app is closed or minimized).
     * 
     * Runs once on component mount.
     */
    useEffect(() => {
        const registerServiceWorker = async () => {
            // Check if browser supports service workers
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    // We knowingly do not log success to keep console clean, per production standards.
                } catch (error) {
                    // Critical error: Push notifications absolutely will not work without this.
                    console.error('❌ Service Worker registration failed:', error);
                }
            }
        };

        registerServiceWorker();
    }, []);

    /**
     * Effect: Token Management
     * 
     * Orchestrates the flow of:
     * 1. Requesting Permission -> 2. Getting Token -> 3. Syncing to Backend
     * 
     * Dependency: [user] - Re-runs registration whenever the logged-in user changes
     * to ensure the device token is associated with the correct account in the DB.
     */
    useEffect(() => {
        const registerToken = async () => {
            // Do not attempt registration if no user is authenticated
            if (!user) return;

            try {
                // 1. Request explicit permission from the user
                const permission = await Notification.requestPermission();

                if (permission === "granted") {
                    // 2. Retrieve the FCM token from Firebase SDK
                    const token = await getToken();
                    if (token) {
                        setFcmToken(token);

                        // 3. Send token to backend API for storage
                        // This allows the server to target this specific device/user
                        await jwtPermissionsApi.post("/api/fcm/register", { token });
                    } else {
                        console.warn("⚠️ Failed to get FCM token: Token generation returned null");
                    }
                } else {
                    console.warn("⚠️ Notification permission denied by user");
                }
            } catch (error) {
                console.error("❌ Error registering FCM token:", error);
            }
        };

        registerToken();
    }, [user]);

    /**
     * Effect: Foreground Message Listener
     * 
     * Sets up a listener for messages received while the application is in the FOREGROUND.
     * Firebase Service Worker handles background messages automatically, but foreground
     * messages must be handled manually by the client code.
     * 
     * Action: Triggers a visual Toast notification using 'sonner'.
     */
    useEffect(() => {
        onMessageListener().then((payload: any) => {
            if (payload) {
                // Display the notification content as a toast
                toast(payload.notification?.title || "Nueva Notificación", {
                    description: payload.notification?.body,
                });
            }
        }).catch(err => {
            console.error("Error in message listener:", err);
        });
    }, []);

    return { fcmToken };
}
