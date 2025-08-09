
import { useCallback, useState } from "react"
import { Notification } from "@/lib/types"
import { 
    fetchNotifications, 
    fetchUnreadNotifications, 
    fetchReadNotifications, 
    fetchArchivedNotifications,
    markAsRead as markAsReadApi,
    markAsUnread as markAsUnreadApi,
    archiveNotification as archiveNotificationApi,
    unarchiveNotification as unarchiveNotificationApi,
    deleteNotification as deleteNotificationApi,
    markAllAsRead as markAllAsReadApi
} from "@/api/notifications/notificationsApi"
import { useAuth } from "@/components/providers/auth-provider"

export function useNotifications() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadNotifications = useCallback(async () => {
        if (!user?.id) return
        
        setLoading(true)
        setError(null)
        try {
            const data = await fetchNotifications(user.id)
            setNotifications(data)
        } catch (err) {
            setError("Error al cargar las notificaciones")
        } finally {
            setLoading(false)
        }
    }, [user?.id])

    const loadUnreadNotifications = useCallback(async () => {
        if (!user?.id) return
        
        try {
            const data = await fetchUnreadNotifications(user.id)
            setNotifications(prev => {
                const readNotifications = prev.filter(n => n.read)
                return [...data, ...readNotifications]
            })
        } catch (err) {
            setError("Error al cargar las notificaciones no leídas")
        }
    }, [user?.id])

    const loadReadNotifications = useCallback(async () => {
        if (!user?.id) return
        
        try {
            const data = await fetchReadNotifications(user.id)
            setNotifications(prev => {
                const unreadNotifications = prev.filter(n => !n.read)
                return [...unreadNotifications, ...data]
            })
        } catch (err) {
            setError("Error al cargar las notificaciones leídas")
        }
    }, [user?.id])

    const loadArchivedNotifications = useCallback(async () => {
        if (!user?.id) return
        
        try {
            const data = await fetchArchivedNotifications(user.id)
            setNotifications(prev => {
                const nonArchivedNotifications = prev.filter(n => !n.archived)
                return [...nonArchivedNotifications, ...data]
            })
        } catch (err) {
            setError("Error al cargar las notificaciones archivadas")
        }
    }, [user?.id])

    // Update functions with API calls
    const markAsRead = useCallback(async (id: number) => {
        try {
            await markAsReadApi(id)
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            )
        } catch (err) {
            setError("Error al marcar como leída")
        }
    }, [])

    const markAsUnread = useCallback(async (id: number) => {
        try {
            await markAsUnreadApi(id)
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: false } : n))
            )
        } catch (err) {
            setError("Error al marcar como no leída")
        }
    }, [])

    const archiveNotification = useCallback(async (id: number) => {
        try {
            await archiveNotificationApi(id)
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, archived: true, read: true } : n))
            )
        } catch (err) {
            setError("Error al archivar notificación")
        }
    }, [])

    const unarchiveNotification = useCallback(async (id: number) => {
        try {
            await unarchiveNotificationApi(id)
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, archived: false } : n))
            )
        } catch (err) {
            setError("Error al desarchivar notificación")
        }
    }, [])

    const deleteNotification = useCallback(async (id: number) => {
        try {
            await deleteNotificationApi(id)
            setNotifications((prev) => prev.filter((n) => n.id !== id))
        } catch (err) {
            setError("Error al eliminar notificación")
        }
    }, [])

    const markAllAsRead = useCallback(async () => {
        if (!user?.id) return
        
        try {
            await markAllAsReadApi(user.id)
            setNotifications((prev) =>
                prev.map((n) => (!n.read ? { ...n, read: true } : n))
            )
        } catch (err) {
            setError("Error al marcar todas como leídas")
        }
    }, [user?.id])

    return {
        notifications,
        loading,
        error,
        loadNotifications,
        loadUnreadNotifications,
        loadReadNotifications,
        loadArchivedNotifications,
        markAsRead,
        markAsUnread,
        archiveNotification,
        unarchiveNotification,
        deleteNotification,
        markAllAsRead,
        setNotifications, // optional
    }
}
