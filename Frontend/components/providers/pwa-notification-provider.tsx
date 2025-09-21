'use client';

import { useAuth } from '@/contexts/auth-provider';
import { PWANotificationState, usePWANotifications } from '@/hooks/notifications/use-pwa-notifications';
import { createContext, ReactNode, useContext, useEffect } from 'react';

interface PWANotificationContextType extends PWANotificationState {
  isGranted: boolean;
  isActive: boolean;
  requestPermission: () => Promise<boolean>;
  togglePushNotifications: (enable: boolean) => Promise<boolean>;
  updatePreferences: (preferences: any) => Promise<boolean>;
  loadPreferences: () => Promise<void>;
}

const PWANotificationContext = createContext<PWANotificationContextType | undefined>(undefined);

interface PWANotificationProviderProps {
  children: ReactNode;
}

export function PWANotificationProvider({ children }: PWANotificationProviderProps) {
  const { user } = useAuth();
  const notificationHook = usePWANotifications();

  // Load preferences only when user is authenticated
  useEffect(() => {
    if (user && notificationHook.isSupported && notificationHook.loadPreferences) {
      notificationHook.loadPreferences();
    }
  }, [user, notificationHook.isSupported, notificationHook.loadPreferences]);

  // Auto-request permission for logged-in users (optional)
  useEffect(() => {
    if (user && notificationHook.isSupported && notificationHook.permission === 'default') {
      // Optionally auto-prompt for notifications
      // notificationHook.requestPermission();
    }
  }, [user, notificationHook.isSupported, notificationHook.permission]);

  // Register service worker for notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // Check if we already have a service worker registered
          const registration = await navigator.serviceWorker.getRegistration();
          
          if (!registration) {
            // Register our custom service worker for notifications
            await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
              scope: '/'
            });
            console.log('Service Worker registered successfully');
          } else {
            console.log('Service Worker already registered');
          }
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      };

      registerSW();
    }
  }, []);

  const value: PWANotificationContextType = {
    ...notificationHook
  };

  return (
    <PWANotificationContext.Provider value={value}>
      {children}
    </PWANotificationContext.Provider>
  );
}

export function usePWANotificationContext(): PWANotificationContextType {
  const context = useContext(PWANotificationContext);
  
  if (context === undefined) {
    throw new Error('usePWANotificationContext must be used within a PWANotificationProvider');
  }
  
  return context;
}

// Helper hook for quick status checks
export function useNotificationStatus() {
  const { 
    isSupported, 
    isGranted, 
    isActive, 
    permission, 
    pushNotificationsEnabled,
    hasDeviceTokens 
  } = usePWANotificationContext();
  
  return {
    isSupported,
    isGranted,
    isActive,
    permission,
    pushNotificationsEnabled,
    hasDeviceTokens,
    canReceiveNotifications: isSupported && isGranted && pushNotificationsEnabled && hasDeviceTokens,
    needsPermission: isSupported && !hasDeviceTokens,
    isBlocked: permission === 'denied',
    needsToggle: hasDeviceTokens && !pushNotificationsEnabled
  };
}