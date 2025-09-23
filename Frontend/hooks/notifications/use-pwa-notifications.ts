import { disablePushNotifications, enablePushNotifications, getNotificationPreferences, getPushNotificationStatus, registerDeviceToken, updateNotificationPreferences } from '@/api/notifications/notificationsApi';
import { useToast } from '@/hooks/use-toast';
import { requestNotificationPermission, setupForegroundNotifications } from '@/lib/firebase-messaging';
import { NotificationPreferences } from '@/lib/types';
import { MessagePayload } from 'firebase/messaging';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';


export interface PWANotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  token: string | null;
  isLoading: boolean;
  preferences: NotificationPreferences | null;
  // Estado lógico de notificaciones push (independiente del token)
  pushNotificationsEnabled: boolean;
  hasDeviceTokens: boolean;
}

export const usePWANotifications = () => {
  const [state, setState] = useState<PWANotificationState>({
    isSupported: false,
    permission: 'default',
    token: null,
    isLoading: true,
    preferences: null,
    pushNotificationsEnabled: false,
    hasDeviceTokens: false
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

  // Load user preferences and push notification status - this should only be called when user is authenticated
  const loadPreferences = useCallback(async () => {
    // Check support again to avoid dependency on state
    const isSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
    if (!isSupported) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Load both preferences and push notification status
      const [preferences, pushStatus] = await Promise.all([
        getNotificationPreferences(),
        getPushNotificationStatus()
      ]);

      setState(prev => ({
        ...prev,
        preferences: preferences || {
          classReminders: true,
          paymentDue: true,
          newClasses: true,
          promotions: false,
          classCancellations: true,
          generalAnnouncements: true,
          pushNotificationsEnabled: false
        },
        pushNotificationsEnabled: pushStatus?.pushNotificationsEnabled || false,
        hasDeviceTokens: pushStatus?.hasDeviceTokens || false,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  }, []); // Remove state.isSupported dependency

  // Request notification permission and register device
  const requestPermission = useCallback(async (): Promise<boolean> => {
    // Check support without depending on state
    const isSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
    if (!isSupported) {
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
            hasDeviceTokens: true,
            pushNotificationsEnabled: true, // Se habilita automáticamente al registrar el token
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
  }, [toast]); // Remove state.isSupported dependency

  // Toggle push notifications (solo cambia el estado lógico)
  const togglePushNotifications = async (enable: boolean): Promise<boolean> => {
    // Si se quiere habilitar pero no hay tokens, mostrar mensaje y no hacer nada
    if (enable && !state.hasDeviceTokens) {
      toast({
        title: "🔔 Permisos Requeridos",
        description: "Primero debes permitir las notificaciones usando el botón de 'Solicitar Permisos'",
        variant: "default"
      });
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      let success: boolean;
      
      if (enable) {
        success = await enablePushNotifications();
      } else {
        success = await disablePushNotifications();
      }
      
      if (success) {
        setState(prev => ({
          ...prev,
          pushNotificationsEnabled: enable,
          isLoading: false
        }));

        toast({
          title: enable ? "✅ Notificaciones Activadas" : "🔕 Notificaciones Desactivadas",
          description: enable 
            ? "Recibirás notificaciones importantes de Personal Fit"
            : "Ya no recibirás notificaciones push",
        });

        return true;
      } else {
        throw new Error(`Failed to ${enable ? 'enable' : 'disable'} push notifications`);
      }
    } catch (error) {
      console.error(`Error ${enable ? 'enabling' : 'disabling'} push notifications:`, error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "❌ Error",
        description: `No se pudieron ${enable ? 'activar' : 'desactivar'} las notificaciones`,
        variant: "destructive"
      });
      
      return false;
    }
  };

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
    isActive: state.pushNotificationsEnabled && state.hasDeviceTokens,
    requestPermission,
    togglePushNotifications,
    updatePreferences,
    loadPreferences
  };
};