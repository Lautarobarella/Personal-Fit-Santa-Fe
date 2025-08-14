
import { fetchNotifications } from "@/api/notifications/notificationsApi"
import { Notification } from "@/lib/types"
import { useCallback, useState } from "react"

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadNotifications = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchNotifications()
            setNotifications(data || []) // Asegurar que siempre sea un array
        } catch (err) {
            console.error("Error loading notifications:", err)
            // Solo establecer error si es un error real, no si solo no hay notificaciones
            if (err instanceof Error && !err.message.includes('404')) {
                setError("Error al cargar las notificaciones")
            } else {
                // Si es 404 o no hay notificaciones, simplemente establecer array vacío
                setNotifications([])
            }
        } finally {
            setLoading(false)
        }
    }, [])

    // Update functions
    const markAsRead = (id: number) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
    }

    const markAsUnread = (id: number) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: false } : n))
        )
    }

    const archiveNotification = (id: number) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, archived: true, read: true } : n))
        )
    }

    const unarchiveNotification = (id: number) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, archived: false } : n))
        )
    }

    const deleteNotification = (id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
    }

    const markAllAsRead = () => {
        setNotifications((prev) =>
            prev.map((n) => (!n.read ? { ...n, read: true } : n))
        )
    }

    return {
        notifications,
        loading,
        error,
        loadNotifications,
        markAsRead,
        markAsUnread,
        archiveNotification,
        unarchiveNotification,
        deleteNotification,
        markAllAsRead,
        setNotifications, // optional
    }
}
