import { getUserId } from "@/lib/auth"
import { useMemo, useState, useCallback, useEffect } from "react"
import { NotificationRepository } from "@/lib/notifications/infrastructure/notification-repository"
import { NotificationStatus } from "@/lib/types"
import type { NotificationEntity, NotificationOperationResult } from "@/lib/notifications/domain/types"

/**
 * Simplified hook for managing notifications
 * Replaces the complex 322-line hook with clean, focused responsibility
 */
export function useSimpleNotifications() {
  const [notifications, setNotifications] = useState<NotificationEntity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const repository = useMemo(() => new NotificationRepository(), [])
  const userId = getUserId()

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!userId) {
      console.warn('No user ID available for loading notifications')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const result = await repository.getUserNotifications({
        userId,
        sortBy: 'date',
        sortOrder: 'desc'
      })
      
      setNotifications(result.notifications)
    } catch (err) {
      console.error("Error loading notifications:", err)
      setError("Error al cargar las notificaciones")
    } finally {
      setIsLoading(false)
    }
  }, [repository, userId])

  // Mark as read
  const markAsRead = useCallback(async (id: number): Promise<NotificationOperationResult> => {
    try {
      const result = await repository.markAsRead(id)
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, status: NotificationStatus.READ } : n)
        )
      }
      return result
    } catch (error) {
      console.error("Error marking notification as read:", error)
      return { success: false, message: "Error al marcar como leída" }
    }
  }, [repository])

  // Mark as unread
  const markAsUnread = useCallback(async (id: number): Promise<NotificationOperationResult> => {
    try {
      const result = await repository.markAsUnread(id)
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, status: NotificationStatus.UNREAD } : n)
        )
      }
      return result
    } catch (error) {
      console.error("Error marking notification as unread:", error)
      return { success: false, message: "Error al marcar como no leída" }
    }
  }, [repository])

  // Archive notification
  const archiveNotification = useCallback(async (id: number): Promise<NotificationOperationResult> => {
    try {
      const result = await repository.archiveNotification(id)
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, status: NotificationStatus.ARCHIVED } : n)
        )
      }
      return result
    } catch (error) {
      console.error("Error archiving notification:", error)
      return { success: false, message: "Error al archivar" }
    }
  }, [repository])

  // Delete notification
  const deleteNotification = useCallback(async (id: number): Promise<NotificationOperationResult> => {
    try {
      const result = await repository.deleteNotification(id)
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
      return result
    } catch (error) {
      console.error("Error deleting notification:", error)
      return { success: false, message: "Error al eliminar" }
    }
  }, [repository])

  // Mark all as read
  const markAllAsRead = useCallback(async (): Promise<NotificationOperationResult> => {
    if (!userId) {
      return { success: false, message: "Usuario no identificado" }
    }

    try {
      const result = await repository.markAllAsRead(userId)
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => n.status === NotificationStatus.UNREAD 
            ? { ...n, status: NotificationStatus.READ } 
            : n
          )
        )
      }
      return result
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      return { success: false, message: "Error al marcar todas como leídas" }
    }
  }, [repository, userId])

  // Computed values
  const unreadCount = useMemo(() => 
    notifications.filter(n => n.status === NotificationStatus.UNREAD).length, 
    [notifications]
  )

  const unreadNotifications = useMemo(() => 
    notifications.filter(n => n.status === NotificationStatus.UNREAD), 
    [notifications]
  )

  const archivedNotifications = useMemo(() => 
    notifications.filter(n => n.status === NotificationStatus.ARCHIVED), 
    [notifications]
  )

  const readNotifications = useMemo(() => 
    notifications.filter(n => n.status === NotificationStatus.READ), 
    [notifications]
  )

  // Auto-load on mount and setup refresh interval
  useEffect(() => {
    loadNotifications()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  return {
    // State
    notifications,
    isLoading,
    error,
    unreadCount,
    
    // Computed values
    unreadNotifications,
    archivedNotifications,
    readNotifications,
    
    // Actions
    loadNotifications,
    markAsRead,
    markAsUnread,
    archiveNotification,
    deleteNotification,
    markAllAsRead,
    
    // Utils
    refreshNotifications: loadNotifications,
    clearNotifications: useCallback(() => {
      setNotifications([])
      setError(null)
    }, []),
  }
}