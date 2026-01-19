"use client"

import { useEffect, useState } from "react";
import { getToken, onMessageListener } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-provider";
import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { toast } from "sonner";

export function useFCM() {
    const { user } = useAuth();
    const [fcmToken, setFcmToken] = useState<string | null>(null);

    useEffect(() => {
        const registerServiceWorker = async () => {
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    console.log('✅ Service Worker registered:', registration);
                } catch (error) {
                    console.error('❌ Service Worker registration failed:', error);
                }
            }
        };

        registerServiceWorker();
    }, []);

    useEffect(() => {
        const registerToken = async () => {
            if (!user) return;

            try {
                const permission = await Notification.requestPermission();
                console.log('🔔 Notification permission:', permission);
                
                if (permission === "granted") {
                    const token = await getToken();
                    if (token) {
                        setFcmToken(token);
                        // Register token with backend
                        await jwtPermissionsApi.post("/api/fcm/register", { token });
                        console.log("✅ FCM Token registered:", token);
                    } else {
                        console.warn("⚠️ Failed to get FCM token");
                    }
                } else {
                    console.warn("⚠️ Notification permission denied");
                }
            } catch (error) {
                console.error("❌ Error registering FCM token:", error);
            }
        };

        registerToken();
    }, [user]);

    useEffect(() => {
        onMessageListener().then((payload: any) => {
            if (payload) {
                console.log("📩 Foreground Message received:", payload);
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
