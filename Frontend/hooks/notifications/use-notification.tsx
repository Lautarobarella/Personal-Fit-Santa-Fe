"use client"

import {
    fetchMyNotifications,
    registerDeviceToken,
    getNotificationPreferences,
    updateNotificationPreferences,
    unsubscribeFromPushNotifications,
    getSubscriptionStatus
} from "@/api/notifications/notificationsApi"
import { useAuth } from "@/contexts/auth-provider"
import { requestNotificationPermission, onMessageListener } from "@/lib/firebase-messaging"
import {
    type Notification as AppNotification,
    NotificationPermissionState,
    NotificationPreferences
} from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"

export interface NotificationState {
    // Estados principales
    notifications: AppNotification[]
    isLoading: boolean
    error: string | null
    unreadCount: number

    // Estado de permisos FCM y Suscripción
    permissionState: NotificationPermissionState
    fcmToken: string | null
    isTokenRegistered: boolean
    hasDeviceTokens: boolean
    isActive: boolean // Alias para UI
    preferences: NotificationPreferences | null

    // Funciones
    requestPermission: () => Promise<boolean>
    subscribe: () => Promise<boolean>
    unsubscribe: () => Promise<boolean>
    refreshNotifications: () => Promise<void>
    updatePreferences: (prefs: NotificationPreferences) => Promise<boolean>
    clearError: () => void

    // Acciones sobre notificaciones
    markAsRead: (id: number) => Promise<void>
    markAllAsRead: () => Promise<void>
    deleteNotification: (id: number) => Promise<void>

    // Compatibilidad con UI existente
    isSupported: boolean
    isGranted: boolean
    loading: boolean // Alias para isLoading
}

export const useNotification = (): NotificationState => {
    // Estados principales
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Estados FCM y Preferencias
    const [permissionState, setPermissionState] = useState<NotificationPermissionState>(NotificationPermissionState.DEFAULT)
    const [fcmToken, setFcmToken] = useState<string | null>(null)
    const [isTokenRegistered, setIsTokenRegistered] = useState(false)
    const [hasDeviceTokens, setHasDeviceTokens] = useState(false)
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
    const [isSupported, setIsSupported] = useState(false)

    // Hooks
    const { user } = useAuth()
    const isAuthenticated = !!user
    const { toast } = useToast()
    const router = useRouter()

    // ===============================
    // 1. INICIALIZACIÓN Y CARGA DE DATOS
    // ===============================

    const refreshNotifications = useCallback(async () => {
        if (!isAuthenticated) return

        try {
            // No mostramos loading global para refrescos en segundo plano
            const fetchedNotifications = await fetchMyNotifications()
            setNotifications(fetchedNotifications)
        } catch (error) {
            console.error('Error refreshing notifications:', error)
        }
    }, [isAuthenticated])

    const loadUserData = useCallback(async () => {
        if (!isAuthenticated) return

        try {
            const [prefs, status] = await Promise.all([
                getNotificationPreferences(),
                getSubscriptionStatus()
            ])

            if (prefs) setPreferences(prefs)
            if (status) setHasDeviceTokens(status.activeTokensCount > 0)

        } catch (error) {
            console.error('Error loading notification user data:', error)
        }
    }, [isAuthenticated])

    const handleNavigation = useCallback((data: any) => {
        if (data.url) {
            router.push(data.url)
        } else if (data.type === 'class_reminder' && data.activityId) {
            router.push(`/activities/${data.activityId}`)
        } else if (data.type === 'payment_due') {
            router.push('/payments')
        } else {
            router.push('/dashboard')
        }
    }, [router])

    const setupForegroundMessageListener = useCallback(async () => {
        try {
            onMessageListener((payload: any) => {
                console.log('📱 Foreground notification received:', payload)

                const title = payload.notification?.title || payload.data?.title || 'Personal Fit'
                const body = payload.notification?.body || payload.data?.body || 'Nueva notificación'
                const data = payload.data || {}

                toast({
                    title,
                    description: body,
                    action: (
                        <div
                            className="cursor-pointer font-medium hover:underline"
                            onClick={() => handleNavigation(data)}
                        >
                            Ver
                        </div>
                    ),
                    duration: 5000,
                })

                refreshNotifications()
            })
        } catch (error) {
            console.error('Error setting up foreground listener:', error)
        }
    }, [toast, refreshNotifications, handleNavigation])

    const initializeFirebaseMessaging = useCallback(async () => {
        try {
            // Verificar estado inicial de permisos
            if (typeof window !== 'undefined' && 'Notification' in window) {
                setIsSupported(true)
                setPermissionState(Notification.permission as NotificationPermissionState)
            }

            // Configurar listener para notificaciones en primer plano
            setupForegroundMessageListener()

        } catch (error) {
            console.error('Error initializing Firebase messaging:', error)
        }
    }, [setupForegroundMessageListener])

    useEffect(() => {
        if (isAuthenticated) {
            initializeFirebaseMessaging()
            refreshNotifications()
            loadUserData()
        }
    }, [isAuthenticated, refreshNotifications, loadUserData, initializeFirebaseMessaging])

    // ===============================
    // 2. GESTIÓN DE PERMISOS Y SUSCRIPCIONES
    // ===============================

    const requestPermission = useCallback(async (): Promise<boolean> => {
        try {
            setIsLoading(true)
            setError(null)

            // Solicitar permiso nativo
            const token = await requestNotificationPermission()

            if (token) {
                setPermissionState(NotificationPermissionState.GRANTED)
                setFcmToken(token)

                // Detectar tipo de dispositivo
                const deviceType = /android/i.test(navigator.userAgent) ? 'ANDROID' :
                    /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'IOS' : 'WEB'

                // Registrar en backend
                const success = await registerDeviceToken({ token, deviceType })
                setIsTokenRegistered(success)

                if (success) {
                    setHasDeviceTokens(true)
                    toast({
                        title: "✅ Notificaciones habilitadas",
                        description: "Recibirás notificaciones importantes en este dispositivo",
                    })
                    return true
                }
            } else {
                setPermissionState(NotificationPermissionState.DENIED)
                setError('Permisos de notificación denegados o error al obtener token')
            }

            return false
        } catch (error) {
            console.error('Error requesting notification permission:', error)
            setError('Error al solicitar permisos')
            return false
        } finally {
            setIsLoading(false)
        }
    }, [toast])

    const unsubscribe = useCallback(async (): Promise<boolean> => {
        try {
            setIsLoading(true)
            const success = await unsubscribeFromPushNotifications()

            if (success) {
                setHasDeviceTokens(false)
                setIsTokenRegistered(false)
                setFcmToken(null)
                toast({
                    title: "Desuscrito",
                    description: "Ya no recibirás notificaciones push en este dispositivo",
                })
                return true
            }
            return false
        } catch (error) {
            console.error('Error unsubscribing:', error)
            return false
        } finally {
            setIsLoading(false)
        }
    }, [toast])

    const updatePreferencesHandler = useCallback(async (newPrefs: NotificationPreferences): Promise<boolean> => {
        try {
            const success = await updateNotificationPreferences(newPrefs)
            if (success) {
                setPreferences(newPrefs)
                toast({
                    title: "Preferencias actualizadas",
                    description: "Tus preferencias de notificación se han guardado",
                })
                return true
            }
            return false
        } catch (error) {
            console.error('Error updating preferences:', error)
            return false
        }
    }, [toast])

    // ===============================
    // 3. ACCIONES SOBRE NOTIFICACIONES
    // ===============================

    const markAsRead = async (id: number) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'READ' as any } : n))
        // Aquí iría la llamada a la API real
    }

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' as any })))
        // API call
    }

    const deleteNotification = async (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
        // API call
    }

    const clearError = () => setError(null)

    return {
        notifications,
        isLoading,
        loading: isLoading,
        error,
        unreadCount: notifications.filter(n => n.status === 'UNREAD').length,

        permissionState,
        fcmToken,
        isTokenRegistered,
        hasDeviceTokens,
        isActive: hasDeviceTokens,
        preferences,
        isSupported,
        isGranted: permissionState === NotificationPermissionState.GRANTED,

        requestPermission,
        subscribe: requestPermission, // Alias
        unsubscribe,
        refreshNotifications,
        updatePreferences: updatePreferencesHandler,
        clearError,

        markAsRead,
        markAllAsRead,
        deleteNotification
    }
}
