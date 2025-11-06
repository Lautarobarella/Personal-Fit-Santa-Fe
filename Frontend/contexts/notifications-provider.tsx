"use client"

import { registerFCMToken, fetchMyNotifications } from "@/api/notifications/notificationsApi"
import { useAuth } from "@/contexts/auth-provider"
import { initializeFirebase, getMessaging, requestNotificationPermission, onMessageListener } from "@/lib/firebase-messaging"
import { 
  FCMNotificationPayload, 
  type Notification, 
  NotificationPermissionState,
  FCMNotificationType
} from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"

// ===============================
// TYPES & INTERFACES
// ===============================

interface NotificationState {
  // Estados principales
  notifications: Notification[]
  isLoading: boolean
  error: string | null
  
  // Estado de permisos FCM
  permissionState: NotificationPermissionState
  fcmToken: string | null
  isTokenRegistered: boolean
  
  // Funciones
  requestPermission: () => Promise<boolean>
  refreshNotifications: () => Promise<void>
  clearError: () => void
}

// ===============================
// CONTEXT CREATION
// ===============================

const NotificationsContext = createContext<NotificationState | undefined>(undefined)

// ===============================
// NOTIFICATIONS PROVIDER - Implementación según documento FCM
// ===============================

interface NotificationsProviderProps {
  children: ReactNode
}

/**
 * Provider de notificaciones implementado según el documento FCM
 * 
 * Responsabilidades:
 * 1. Solicitud de permiso de notificaciones (sección 1.1)
 * 2. Obtención y almacenamiento de token FCM (sección 1.2)
 * 3. Envío del token al backend (sección 1.3)
 * 4. Manejo de notificaciones en primer plano (sección 4.2)
 */
export function NotificationsProvider({ children }: NotificationsProviderProps) {
  // Estados principales
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados FCM
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>(NotificationPermissionState.DEFAULT)
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [isTokenRegistered, setIsTokenRegistered] = useState(false)
  
  // Hooks
  const { user } = useAuth()
  const isAuthenticated = !!user
  const { toast } = useToast()

  // ===============================
  // 1. INICIALIZACIÓN DE FIREBASE Y PERMISOS (Sección 1.1 y 1.2 del documento)
  // ===============================

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return
    }

    initializeFirebaseMessaging()
  }, [isAuthenticated, user])

  const initializeFirebaseMessaging = async () => {
    try {
      // Inicializar Firebase
      await initializeFirebase()
      
      // Verificar estado inicial de permisos
      const currentPermission = Notification.permission as NotificationPermissionState
      setPermissionState(currentPermission)
      
      // Si ya tenemos permiso, obtener token
      if (currentPermission === NotificationPermissionState.GRANTED) {
        await obtainAndRegisterToken()
      }
      
      // Configurar listener para notificaciones en primer plano (sección 4.2)
      setupForegroundMessageListener()
      
    } catch (error) {
      console.error('Error initializing Firebase messaging:', error)
      setError('Error al inicializar las notificaciones push')
    }
  }

  /**
   * Solicita permiso de notificaciones (sección 1.1 del documento)
   * Implementa UI amigable antes de la solicitud nativa del navegador
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Mostrar UI amigable antes de la solicitud nativa (sección 1.1)
      const userConsent = await showFriendlyPermissionUI()
      if (!userConsent) {
        return false
      }
      
      // Solicitar permiso nativo del navegador
      const permission = await requestNotificationPermission()
      const newPermissionState = permission as NotificationPermissionState
      setPermissionState(newPermissionState)
      
      if (newPermissionState === NotificationPermissionState.GRANTED) {
        // Obtener y registrar token FCM (secciones 1.2 y 1.3)
        await obtainAndRegisterToken()
        
        toast({
          title: "✅ Notificaciones habilitadas",
          description: "Recibirás notificaciones push en este dispositivo",
        })
        
        return true
      } else {
        setError('Permisos de notificación denegados')
        return false
      }
      
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      setError('Error al solicitar permisos de notificación')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  /**
   * Obtiene el token FCM y lo registra en el backend (secciones 1.2 y 1.3)
   */
  const obtainAndRegisterToken = async () => {
    try {
      const messaging = await getMessaging()
      if (!messaging) {
        throw new Error('Firebase messaging not available')
      }
      
      // Obtener token FCM (sección 1.2)
      const { getToken } = await import('firebase/messaging')
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      })
      
      if (token) {
        // Almacenar en estado y localStorage (sección 1.2)
        setFcmToken(token)
        localStorage.setItem('fcm_token', token)
        
        // Enviar al backend (sección 1.3)
        const success = await registerFCMToken(token, navigator.userAgent)
        setIsTokenRegistered(success)
        
        if (success) {
          console.log('✅ FCM token registered successfully')
        } else {
          console.error('❌ Failed to register FCM token in backend')
        }
      }
      
    } catch (error) {
      console.error('Error obtaining FCM token:', error)
      throw error
    }
  }

  // ===============================
  // 2. MANEJO DE NOTIFICACIONES EN PRIMER PLANO (Sección 4.2 del documento)
  // ===============================

  /**
   * Configura el listener para notificaciones cuando la PWA está abierta y enfocada
   * Implementa la sección 4.2 del documento: muestra toast en lugar de notificación push
   */
  const setupForegroundMessageListener = async () => {
    try {
      const messaging = await getMessaging()
      if (!messaging) return
      
      // Usar el helper onMessageListener que maneja onMessage
      onMessageListener((payload: any) => {
        console.log('📱 Foreground notification received:', payload)
        
        // En lugar de notificación push, mostrar toast (sección 4.2)
        const title = payload.notification?.title || 'Personal Fit Santa Fe'
        const body = payload.notification?.body || 'Nueva notificación'
        
        // Determinar el tipo de toast según el tipo de notificación
        const notificationType = payload.data?.type as FCMNotificationType
        const isImportant = [
          FCMNotificationType.PAYMENT_EXPIRED,
          FCMNotificationType.PAYMENT_DUE_REMINDER
        ].includes(notificationType)
        
        toast({
          title,
          description: body,
          duration: isImportant ? 10000 : 5000, // Notificaciones importantes duran más
        })
        
        // Actualizar el estado de la aplicación si es necesario
        if (payload.data) {
          handleForegroundNotificationData(payload.data)
        }
        
        // Refrescar lista de notificaciones
        refreshNotifications()
      })
      
    } catch (error) {
      console.error('Error setting up foreground message listener:', error)
    }
  }

  /**
   * Maneja datos adicionales de notificaciones en primer plano
   * Permite actualizar el estado de la aplicación según el tipo
   */
  const handleForegroundNotificationData = (data: any) => {
    const type = data.type as FCMNotificationType
    
    switch (type) {
      case FCMNotificationType.NEW_ACTIVITY:
        // Podrías disparar un refresh de actividades
        console.log('New activity notification - consider refreshing activities')
        break
        
      case FCMNotificationType.PAYMENT_EXPIRED:
      case FCMNotificationType.PAYMENT_DUE_REMINDER:
        // Podrías disparar un refresh de pagos
        console.log('Payment notification - consider refreshing payments')
        break
        
      default:
        console.log('General notification received:', type)
    }
  }

  // ===============================
  // 3. GESTIÓN DEL HISTORIAL DE NOTIFICACIONES
  // ===============================

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      setIsLoading(true)
      const fetchedNotifications = await fetchMyNotifications()
      setNotifications(fetchedNotifications)
    } catch (error) {
      console.error('Error refreshing notifications:', error)
      setError('Error al actualizar notificaciones')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Cargar notificaciones iniciales
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshNotifications()
    }
  }, [isAuthenticated, user, refreshNotifications])

  // ===============================
  // 4. FUNCIONES DE UTILIDAD
  // ===============================

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Muestra UI amigable antes de solicitar permiso nativo
   * Implementa la sección 1.1 del documento para maximizar tasa de aceptación
   */
  const showFriendlyPermissionUI = (): Promise<boolean> => {
    // En una implementación real, mostrarías un modal o banner explicativo
    // Por ahora, usamos confirm() como placeholder
    return Promise.resolve(
      confirm(
        '🔔 ¿Quieres recibir notificaciones push sobre:\n\n' +
        '• Recordatorios de clases\n' +
        '• Pagos vencidos\n' +
        '• Nuevas actividades\n' +
        '• Anuncios importantes\n\n' +
        '¿Permitir notificaciones?'
      )
    )
  }

  // ===============================
  // 5. ESTADO DEL PROVIDER
  // ===============================

  const value: NotificationState = {
    // Estados principales
    notifications,
    isLoading,
    error,
    
    // Estado FCM
    permissionState,
    fcmToken,
    isTokenRegistered,
    
    // Funciones
    requestPermission,
    refreshNotifications,
    clearError
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

// ===============================
// HOOK PARA USAR EL CONTEXTO
// ===============================

export function useNotifications(): NotificationState {
  const context = useContext(NotificationsContext)
  
  if (context === undefined) {
    throw new Error('useNotifications debe ser usado dentro de un NotificationsProvider')
  }
  
  return context
}