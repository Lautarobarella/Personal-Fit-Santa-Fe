"use client"

import {
    archiveNotification as archiveNotificationApi,
    deleteNotification as deleteNotificationApi,
    fetchNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    markNotificationAsUnread
} from "@/api/notifications/notificationsApi"
import { Notification, NotificationStatus } from "@/lib/types"
import { useCallback, useEffect, useMemo, useState } from "react"

/**
 * Tipos para el estado del hook
 */
interface NotificationLoadingStates {
  isLoading: boolean
  isMarkingAsRead: boolean
  isMarkingAsUnread: boolean
  isArchiving: boolean
  isUnarchiving: boolean
  isDeleting: boolean
  isMarkingAllAsRead: boolean
}

interface NotificationMutationResult {
  success: boolean
  message: string
}

/**
 * Custom Hook para manejar todo el estado y lógica de notificaciones
 * Centraliza toda la lógica de negocio y estado en un solo lugar
 */
export function useNotification() {
  // Estado principal
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados de carga específicos para operaciones
  const [loadingStates, setLoadingStates] = useState<NotificationLoadingStates>({
    isLoading: false,
    isMarkingAsRead: false,
    isMarkingAsUnread: false,
    isArchiving: false,
    isUnarchiving: false,
    isDeleting: false,
    isMarkingAllAsRead: false,
  })

  // ===============================
  // FUNCIONES DE UTILIDAD
  // ===============================

  // Helper function to sort notifications by date (newest first)
  const sortNotifications = useCallback((notifications: Notification[]) => {
    return [...notifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }, [])

  // Helper function to update loading state
  const updateLoadingState = useCallback((key: keyof NotificationLoadingStates, value: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  // ===============================
  // FUNCIONES DE CARGA DE DATOS
  // ===============================

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    updateLoadingState('isLoading', true)
    setError(null)
    
    try {
      // fetchNotifications ahora puede obtener el user ID automáticamente desde localStorage
      const data = await fetchNotifications()
      const sortedData = sortNotifications(data || [])
      setNotifications(sortedData)
    } catch (err) {
      console.error("Error loading notifications:", err)
      if (err instanceof Error && !err.message.includes('404')) {
        setError("Error al cargar las notificaciones")
      } else {
        setNotifications([])
      }
    } finally {
      setLoading(false)
      updateLoadingState('isLoading', false)
    }
  }, [sortNotifications, updateLoadingState])

  // ===============================
  // FUNCIONES DE MUTACIÓN
  // ===============================

  const markAsRead = useCallback(async (id: number): Promise<NotificationMutationResult> => {
    updateLoadingState('isMarkingAsRead', true)
    
    try {
      const success = await markNotificationAsRead(id)
      if (success) {
        setNotifications((prev) =>
          sortNotifications(prev.map((n) => (n.id === id ? { ...n, status: NotificationStatus.READ } : n)))
        )
        return { success: true, message: "Notificación marcada como leída" }
      }
      return { success: false, message: "Error al marcar como leída" }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      return { success: false, message: "Error al marcar como leída" }
    } finally {
      updateLoadingState('isMarkingAsRead', false)
    }
  }, [sortNotifications, updateLoadingState])

  const markAsUnread = useCallback(async (id: number): Promise<NotificationMutationResult> => {
    updateLoadingState('isMarkingAsUnread', true)
    
    try {
      const success = await markNotificationAsUnread(id)
      if (success) {
        setNotifications((prev) =>
          sortNotifications(prev.map((n) => (n.id === id ? { ...n, status: NotificationStatus.UNREAD } : n)))
        )
        return { success: true, message: "Notificación marcada como no leída" }
      }
      return { success: false, message: "Error al marcar como no leída" }
    } catch (error) {
      console.error("Error marking notification as unread:", error)
      return { success: false, message: "Error al marcar como no leída" }
    } finally {
      updateLoadingState('isMarkingAsUnread', false)
    }
  }, [sortNotifications, updateLoadingState])

  const archiveNotification = useCallback(async (id: number): Promise<NotificationMutationResult> => {
    updateLoadingState('isArchiving', true)
    
    try {
      const success = await archiveNotificationApi(id)
      if (success) {
        setNotifications((prev) =>
          sortNotifications(prev.map((n) => (n.id === id ? { ...n, status: NotificationStatus.ARCHIVED } : n)))
        )
        return { success: true, message: "Notificación archivada" }
      }
      return { success: false, message: "Error al archivar" }
    } catch (error) {
      console.error("Error archiving notification:", error)
      return { success: false, message: "Error al archivar" }
    } finally {
      updateLoadingState('isArchiving', false)
    }
  }, [sortNotifications, updateLoadingState])

  const unarchiveNotification = useCallback(async (id: number): Promise<NotificationMutationResult> => {
    updateLoadingState('isUnarchiving', true)
    
    try {
      const success = await markNotificationAsRead(id) // Desarchivar = marcar como leído
      if (success) {
        setNotifications((prev) =>
          sortNotifications(prev.map((n) => (n.id === id ? { ...n, status: NotificationStatus.READ } : n)))
        )
        return { success: true, message: "Notificación desarchivada" }
      }
      return { success: false, message: "Error al desarchivar" }
    } catch (error) {
      console.error("Error unarchiving notification:", error)
      return { success: false, message: "Error al desarchivar" }
    } finally {
      updateLoadingState('isUnarchiving', false)
    }
  }, [sortNotifications, updateLoadingState])

  const deleteNotification = useCallback(async (id: number): Promise<NotificationMutationResult> => {
    updateLoadingState('isDeleting', true)
    
    try {
      const success = await deleteNotificationApi(id)
      if (success) {
        setNotifications((prev) => sortNotifications(prev.filter((n) => n.id !== id)))
        return { success: true, message: "Notificación eliminada" }
      }
      return { success: false, message: "Error al eliminar" }
    } catch (error) {
      console.error("Error deleting notification:", error)
      return { success: false, message: "Error al eliminar" }
    } finally {
      updateLoadingState('isDeleting', false)
    }
  }, [sortNotifications, updateLoadingState])

  const markAllAsRead = useCallback(async (): Promise<NotificationMutationResult> => {
    updateLoadingState('isMarkingAllAsRead', true)
    
    try {
      // markAllNotificationsAsRead ahora puede obtener el user ID automáticamente desde localStorage
      const success = await markAllNotificationsAsRead()
      if (success) {
        setNotifications((prev) =>
          sortNotifications(prev.map((n) => (n.status === NotificationStatus.UNREAD ? { ...n, status: NotificationStatus.READ } : n)))
        )
        return { success: true, message: "Todas las notificaciones marcadas como leídas" }
      }
      return { success: false, message: "Error al marcar todas como leídas" }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      return { success: false, message: "Error al marcar todas como leídas" }
    } finally {
      updateLoadingState('isMarkingAllAsRead', false)
    }
  }, [sortNotifications, updateLoadingState])

  // ===============================
  // FUNCIONES DE UTILIDAD COMPUTADAS
  // ===============================

  // Función para filtrar notificaciones por estado
  const getNotificationsByStatus = useCallback((status: NotificationStatus): Notification[] => {
    return notifications.filter(n => n.status === status)
  }, [notifications])

  // Función para obtener notificaciones no leídas
  const getUnreadNotifications = useCallback((): Notification[] => {
    return getNotificationsByStatus(NotificationStatus.UNREAD)
  }, [getNotificationsByStatus])

  // Función para obtener notificaciones archivadas
  const getArchivedNotifications = useCallback((): Notification[] => {
    return getNotificationsByStatus(NotificationStatus.ARCHIVED)
  }, [getNotificationsByStatus])

  // Función para obtener notificaciones leídas
  const getReadNotifications = useCallback((): Notification[] => {
    return getNotificationsByStatus(NotificationStatus.READ)
  }, [getNotificationsByStatus])

  // ===============================
  // VALORES COMPUTADOS
  // ===============================

  // Contador de notificaciones no leídas
  const unreadCount = useMemo(() => {
    return notifications.filter(n => n.status === NotificationStatus.UNREAD).length
  }, [notifications])

  // Estado de carga consolidado
  const isLoading = useMemo(() => 
    loading || Object.values(loadingStates).some(state => state), 
    [loading, loadingStates]
  )

  // ===============================
  // EFECTOS
  // ===============================

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [loadNotifications])

  // ===============================
  // RETORNO DEL HOOK
  // ===============================

  return {
    // Estado
    notifications,
    loading,
    error,
    unreadCount,
    
    // Estados de carga específicos
    ...loadingStates,
    isLoading,
    
    // Funciones de carga
    loadNotifications,
    
    // Funciones de mutación
    markAsRead,
    markAsUnread,
    archiveNotification,
    unarchiveNotification,
    deleteNotification,
    markAllAsRead,
    
    // Funciones de utilidad
    getNotificationsByStatus,
    getUnreadNotifications,
    getArchivedNotifications,
    getReadNotifications,
    
    // Funciones de manipulación directa (para compatibilidad)
    setNotifications: useCallback((notifications: Notification[]) => {
      setNotifications(sortNotifications(notifications))
    }, [sortNotifications]),
    
    // Función para limpiar notificaciones
    clearNotifications: useCallback(() => {
      setNotifications([])
      setError(null)
    }, []),
    
    // Función para refrescar notificaciones
    refreshNotifications: useCallback(async () => {
      await loadNotifications()
    }, [loadNotifications]),
  }
}

export type NotificationState = ReturnType<typeof useNotification>