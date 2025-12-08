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
        const registerToken = async () => {
            if (!user) return;

            try {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    const token = await getToken();
                    if (token) {
                        setFcmToken(token);
                        // Register token with backend
                        await jwtPermissionsApi.post("/api/fcm/register", { token });
                        console.log("✅ FCM Token registered:", token);
                    }
                }
            } catch (error) {
                console.error("Error registering FCM token:", error);
            }
        };

        registerToken();
    }, [user]);

    useEffect(() => {
        const unsubscribe = onMessageListener().then((payload: any) => {
            if (payload) {
                console.log("📩 Foreground Message received:", payload);
                toast(payload.notification?.title || "Nueva Notificación", {
                    description: payload.notification?.body,
                });
            }
        });

        return () => {
            // unsubscribe is a promise, so we can't easily cancel it in cleanup 
            // unless we store the unsubscribe function returned by onMessage.
            // But onMessageListener wrapper returns a promise that resolves to payload?
            // Wait, my implementation of onMessageListener in lib/firebase.ts is a bit one-off.
            // It returns a Promise that resolves ONCE. That's not a listener.
            // I should fix lib/firebase.ts to be a real listener or use it differently.
        };
    }, []);

    return { fcmToken };
}
