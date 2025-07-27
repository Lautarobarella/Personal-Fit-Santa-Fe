
import { fetchNotificationsMock } from "@/api/notifications/notificationsApi"
import { useCallback, useState } from "react"
import { Notification } from "@/lib/types"

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadNotifications = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetchNotificationsMock()
            const data: Notification[] = await res.json()
            setNotifications(data)
            console.log("Notificaciones cargadas:", data)
        } catch (err) {
            setError("Error al cargar los notificaciones")
        } finally {
            setLoading(false)
        }
    }, [])

    // Update functions
    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
    }

    const markAsUnread = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: false } : n))
        )
    }

    const archiveNotification = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, archived: true, read: true } : n))
        )
    }

    const unarchiveNotification = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, archived: false } : n))
        )
    }

    const deleteNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
    }

    const markAllAsRead = (userId: string) => {
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
