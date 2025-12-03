'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase-messaging';
import { registerFCMToken } from '@/api/notifications/notificationsApi';
import { useAuth } from '@/contexts/auth-provider';
import { toast } from 'sonner';

interface PWANotificationContextType {
  isSupported: boolean;
  isGranted: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
}

const PWANotificationContext = createContext<PWANotificationContextType | undefined>(undefined);

export function PWANotificationProvider({ children }: { children: ReactNode }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isGranted, setIsGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Check support on mount
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setIsGranted(Notification.permission === 'granted');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Register service worker on mount
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered with scope:', registration.scope);
        })
        .catch((err) => {
          console.error('❌ Service Worker registration failed:', err);
        });
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Las notificaciones no están soportadas en este navegador.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await requestNotificationPermission();

      if (token) {
        setIsGranted(true);
        // Send token to backend
        if (user) {
          await registerFCMToken(token);
        }
        toast.success('Notificaciones activadas correctamente');
      } else {
        setIsGranted(false);
        toast.error('No se pudieron activar las notificaciones. Verifica los permisos del navegador.');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Error al activar notificaciones');
      setIsGranted(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (isGranted) {
      const unsubscribe = onMessageListener((payload) => {
        const title = payload.notification?.title || payload.data?.title || 'Nueva notificación';
        const body = payload.notification?.body || payload.data?.body || '';

        toast(title, {
          description: body,
        });
      });
      return () => {
        // unsubscribe is void | Unsubscribe, handle accordingly if needed
        // onMessage returns an Unsubscribe function
      };
    }
  }, [isGranted]);

  return (
    <PWANotificationContext.Provider value={{ isSupported, isGranted, isLoading, requestPermission }}>
      {children}
    </PWANotificationContext.Provider>
  );
}

export function usePWANotificationContext() {
  const context = useContext(PWANotificationContext);
  if (context === undefined) {
    throw new Error('usePWANotificationContext must be used within a PWANotificationProvider');
  }
  return context;
}