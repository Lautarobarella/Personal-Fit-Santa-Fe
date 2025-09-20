import { useEffect, useState, useCallback } from 'react';
import { MessagePayload } from 'firebase/messaging';
import { requestNotificationPermission, setupForegroundNotifications } from '@/lib/firebase-messaging';
import { registerDeviceToken, unregisterDeviceToken, getNotificationPreferences, updateNotificationPreferences, type NotificationPreferences } from '@/api/notifications/notificationsApi';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export interface PWANotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  token: string | null;
  isLoading: boolean;
  preferences: NotificationPreferences | null;
}

export const usePWANotifications = () => {
  const [state, setState] = useState<PWANotificationState>({
    isSupported: false,
    permission: 'default',
    token: null,
    isLoading: true,
    preferences: null
  });

  const router = useRouter();
  const { toast } = useToast();

  // Check if notifications are supported (without loading preferences)
  useEffect(() => {
    const checkSupport = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
        setState(prev => ({
          ...prev,
          isSupported: true,
          permission: Notification.permission,
          isLoading: false
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkSupport();
  }, []);

  // Load user preferences - this should only be called when user is authenticated
  const loadPreferences = useCallback(async () => {
    if (!state.isSupported) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const preferences = await getNotificationPreferences();
      setState(prev => ({
        ...prev,
        preferences: preferences || {
          classReminders: true,
          paymentDue: true,
          newClasses: true,
          promotions: false,
          classCancellations: true
        },
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  }, [state.isSupported]);

  // Request notification permission and register device
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      console.warn('Notifications not supported');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        // Register device token with backend
        const success = await registerDeviceToken({
          token,
          deviceType: 'PWA'
        });

        if (success) {
          setState(prev => ({
            ...prev,
            token,
            permission: 'granted',
            isLoading: false
          }));

          toast({
            title: "✅ Notificaciones Activadas",
            description: "Recibirás notificaciones importantes de Personal Fit",
          });

          return true;
        } else {
          throw new Error('Failed to register device token');
        }
      } else {
        setState(prev => ({
          ...prev,
          permission: Notification.permission,
          isLoading: false
        }));
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "❌ Error",
        description: "No se pudieron activar las notificaciones",
        variant: "destructive"
      });
      
      return false;
    }
  }, [state.isSupported, toast]);

  // Disable notifications
  const disableNotifications = useCallback(async (): Promise<boolean> => {
    if (!state.token) {
      return true;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const success = await unregisterDeviceToken(state.token);
      
      if (success) {
        setState(prev => ({
          ...prev,
          token: null,
          isLoading: false
        }));

        toast({
          title: "🔕 Notificaciones Desactivadas",
          description: "Ya no recibirás notificaciones push",
        });

        return true;
      } else {
        throw new Error('Failed to unregister device token');
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "❌ Error",
        description: "No se pudieron desactivar las notificaciones",
        variant: "destructive"
      });
      
      return false;
    }
  }, [state.token, toast]);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences: NotificationPreferences): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const success = await updateNotificationPreferences(newPreferences);
      
      if (success) {
        setState(prev => ({
          ...prev,
          preferences: newPreferences,
          isLoading: false
        }));

        toast({
          title: "✅ Preferencias Actualizadas",
          description: "Tus preferencias de notificaciones han sido guardadas",
        });

        return true;
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "❌ Error",
        description: "No se pudieron actualizar las preferencias",
        variant: "destructive"
      });
      
      return false;
    }
  }, [toast]);

  // Helper function to handle notification navigation
  const handleNotificationNavigation = useCallback((data: Record<string, string>) => {
    const { type, activityId, paymentId } = data;

    switch (type) {
      case 'class_reminder':
        if (activityId) {
          router.push(`/activities/${activityId}`);
        }
        break;
        
      case 'payment_due':
        if (paymentId) {
          router.push(`/payments/${paymentId}`);
        } else {
          router.push('/payments');
        }
        break;
        
      case 'new_class':
        if (activityId) {
          router.push(`/activities/${activityId}`);
        } else {
          router.push('/activities');
        }
        break;
        
      case 'class_cancelled':
        router.push('/activities');
        break;
        
      default:
        router.push('/dashboard');
    }
  }, [router]);

  // Setup foreground message listener
  useEffect(() => {
    if (!state.token) return;

    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      const listener = setupForegroundNotifications((payload: MessagePayload) => {
        // Handle foreground notifications with custom toast
        const title = payload.notification?.title || 'Personal Fit';
        const body = payload.notification?.body || 'Nueva notificación';
        const data = payload.data || {};

        // Show custom toast instead of browser notification
        toast({
          title: title,
          description: body,
          duration: 10000
        });

        // Handle navigation based on notification type
        handleNotificationNavigation(data);
      });

      if (listener) {
        unsubscribe = listener;
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [state.token, router, toast, handleNotificationNavigation]);

  // Setup service worker message listener
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        router.push(event.data.url);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, [router]);

  return {
    ...state,
    isGranted: state.permission === 'granted',
    isActive: state.permission === 'granted' && !!state.token,
    requestPermission,
    disableNotifications,
    updatePreferences,
    loadPreferences
  };
};