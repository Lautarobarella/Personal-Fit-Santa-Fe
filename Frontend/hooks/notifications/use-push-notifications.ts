import { useState, useCallback, useEffect } from "react"
import { requestNotificationPermission, setupForegroundNotifications } from "@/lib/firebase-messaging"
import type { NotificationSubscriptionStatus } from "@/lib/notifications/domain/types"
import { jwtPermissionsApi } from "@/api/JWTAuth/api"
import { handleApiError } from "@/lib/error-handler"

/**
 * Hook for managing push notification subscription
 * Handles permission requests, registration, and status
 */
export function usePushNotificationSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [activeTokensCount, setActiveTokensCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load subscription status
  const loadSubscriptionStatus = useCallback(async () => {
    try {
      const status: NotificationSubscriptionStatus = await jwtPermissionsApi.get('/api/notifications/subscription-status')
      setIsSubscribed(status.isSubscribed)
      setActiveTokensCount(status.activeTokensCount)
    } catch (error) {
      console.error("Error loading subscription status:", error)
      handleApiError(error, 'Error al obtener estado de suscripción')
    }
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      // Request permission and get token
      const token = await requestNotificationPermission()
      
      if (!token) {
        const message = 'No se pudo obtener el token de notificación'
        setError(message)
        return { success: false, message }
      }

      // Register device token
      const registerRequest = {
        token,
        deviceType: 'PWA' as const,
        deviceInfo: navigator.userAgent
      }

      await jwtPermissionsApi.post('/api/notifications/pwa/register-device', registerRequest)
      
      // Update status
      await loadSubscriptionStatus()
      
      return { success: true, message: 'Suscrito exitosamente a las notificaciones' }
      
    } catch (error) {
      console.error("Error subscribing to push notifications:", error)
      const message = 'Error al suscribirse a las notificaciones'
      setError(message)
      handleApiError(error, message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [loadSubscriptionStatus])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      await jwtPermissionsApi.post('/api/notifications/unsubscribe', {})
      
      // Update status
      setIsSubscribed(false)
      setActiveTokensCount(0)
      
      return { success: true, message: 'Desuscrito exitosamente de las notificaciones' }
      
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error)
      const message = 'Error al desuscribirse de las notificaciones'
      setError(message)
      handleApiError(error, message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load status on mount
  useEffect(() => {
    loadSubscriptionStatus()
  }, [loadSubscriptionStatus])

  return {
    // State
    isSubscribed,
    activeTokensCount,
    isLoading,
    error,
    
    // Computed
    canSubscribe: !isSubscribed && !isLoading,
    canUnsubscribe: isSubscribed && !isLoading,
    
    // Actions
    subscribe,
    unsubscribe,
    refreshStatus: loadSubscriptionStatus,
  }
}

/**
 * Hook for handling foreground push notifications
 * Sets up listeners for notifications received while app is open
 */
export function useForegroundPushNotifications() {
  const [latestNotification, setLatestNotification] = useState<any>(null)

  useEffect(() => {
    // Setup foreground notification listener
    const unsubscribe = setupForegroundNotifications((payload) => {
      console.log('🔥 Foreground notification received:', payload)
      setLatestNotification(payload)
      
      // Show browser notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'Personal Fit Santa Fe', {
          body: payload.notification?.body || 'Nueva notificación',
          icon: '/logo.png',
          tag: 'foreground-notification',
        })
      }
    })

    return unsubscribe
  }, [])

  return {
    latestNotification,
    clearLatestNotification: useCallback(() => setLatestNotification(null), [])
  }
}