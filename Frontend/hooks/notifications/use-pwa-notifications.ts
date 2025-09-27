import { getNotificationPreferences, getPushNotificationStatus, registerDeviceToken, updateNotificationPreferences, getSubscriptionStatus, unsubscribeFromPushNotifications } from '@/api/notifications/notificationsApi';
import { useToast } from '@/hooks/use-toast';
import { requestNotificationPermission, setupForegroundNotifications } from '@/lib/firebase-messaging';
import { NotificationPreferences } from '@/lib/types';
import { MessagePayload } from 'firebase/messaging';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/**
 * Detecta el tipo de dispositivo basándose en el user agent y características del navegador
 */
const detectDeviceType = (): 'PWA' | 'WEB' | 'ANDROID' | 'IOS' => {
  if (typeof window === 'undefined') return 'WEB';
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebAppMode = (window.navigator as any).standalone === true; // iOS Safari
  
  // Log información de debug
  console.log('🔍 Device detection info:', {
    userAgent: userAgent.substring(0, 100) + '...',
    isStandalone,
    isInWebAppMode,
    displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
  });
  
  // Detectar si es PWA (instalada)
  if (isStandalone || isInWebAppMode) {
    console.log('✅ Detected as PWA (installed app)');
    return 'PWA';
  }
  
  // Detectar plataforma móvil
  if (/android/i.test(userAgent)) {
    console.log('✅ Detected as ANDROID device');
    return 'ANDROID';
  }
  
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    console.log('✅ Detected as IOS device');
    return 'IOS';
  }
  
  // Por defecto, navegador web
  console.log('✅ Detected as WEB browser');
  return 'WEB';
};


export interface PWANotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  token: string | null;
  isLoading: boolean;
  preferences: NotificationPreferences | null;
  hasDeviceTokens: boolean;
  isSubscribed: boolean;
  canSubscribe: boolean;
  canUnsubscribe: boolean;
  activeTokensCount: number;
}

export const usePWANotifications = () => {
  const [state, setState] = useState<PWANotificationState>({
    isSupported: false,
    permission: 'default',
    token: null,
    isLoading: true,
    preferences: null,
    hasDeviceTokens: false,
    isSubscribed: false,
    canSubscribe: true,
    canUnsubscribe: false,
    activeTokensCount: 0
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
          generalAnnouncements: true
        },
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
        // Detectar tipo de dispositivo automáticamente
        const deviceType = detectDeviceType();
        console.log('🔍 Device type detected:', deviceType);
        
        // Register device token with backend
        const success = await registerDeviceToken({
          token,
          deviceType
        });

        if (success) {
          setState(prev => ({
            ...prev,
            token,
            permission: 'granted',
            hasDeviceTokens: true,
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

  // ===============================
  // GESTIÓN PROFESIONAL DE SUSCRIPCIONES
  // ===============================

  /**
   * Carga el estado de suscripción desde el servidor
   */
  const loadSubscriptionStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const status = await getSubscriptionStatus();
      if (status) {
        setState(prev => ({
          ...prev,
          isSubscribed: status.isSubscribed,
          canSubscribe: status.canSubscribe,
          canUnsubscribe: status.canUnsubscribe,
          activeTokensCount: status.activeTokensCount,
          hasDeviceTokens: status.activeTokensCount > 0,
          isLoading: false
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Desuscribe al usuario de notificaciones push
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const success = await unsubscribeFromPushNotifications();
      if (success) {
        setState(prev => ({
          ...prev,
          isSubscribed: false,
          canSubscribe: true,
          canUnsubscribe: false,
          activeTokensCount: 0,
          hasDeviceTokens: false,
          token: null,
          isLoading: false
        }));

        toast({
          title: "✅ Desuscripción Exitosa",
          description: "Ya no recibirás notificaciones push",
        });

        return true;
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [toast]);

  /**
   * Suscribe al usuario (reutiliza la lógica existente de requestPermission)
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    return await requestPermission();
  }, [requestPermission]);

  return {
    ...state,
    isGranted: state.permission === 'granted',
    isActive: state.hasDeviceTokens,
    requestPermission,
    updatePreferences,
    loadPreferences,
    // Nuevas funciones para gestión profesional
    loadSubscriptionStatus,
    subscribe,
    unsubscribe,
  };
};