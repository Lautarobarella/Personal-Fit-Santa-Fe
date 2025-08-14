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
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react"

interface NotificationsContextType {
    notifications: Notification[]
    loading: boolean
    error: string | null
    unreadCount: number
    loadNotifications: () => Promise<void>
    markAsRead: (id: number) => Promise<void>
    markAsUnread: (id: number) => Promise<void>
    archiveNotification: (id: number) => Promise<void>
    unarchiveNotification: (id: number) => Promise<void>
    deleteNotification: (id: number) => Promise<void>
    markAllAsRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadNotifications = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchNotifications()
            setNotifications(data || [])
        } catch (err) {
            console.error("Error loading notifications:", err)
            if (err instanceof Error && !err.message.includes('404')) {
                setError("Error al cargar las notificaciones")
            } else {
                setNotifications([])
            }
        } finally {
            setLoading(false)
        }
    }, [])

    // Update functions with API calls
    const markAsRead = async (id: number) => {
        const success = await markNotificationAsRead(id)
        if (success) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, status: NotificationStatus.READ } : n))
            )
        }
    }

    const markAsUnread = async (id: number) => {
        const success = await markNotificationAsUnread(id)
        if (success) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, status: NotificationStatus.UNREAD } : n))
            )
        }
    }

    const archiveNotification = async (id: number) => {
        const success = await archiveNotificationApi(id)
        if (success) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, status: NotificationStatus.ARCHIVED } : n))
            )
        }
    }

    const unarchiveNotification = async (id: number) => {
        const success = await markNotificationAsRead(id) // Desarchivar = marcar como leído
        if (success) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, status: NotificationStatus.READ } : n))
            )
        }
    }

    const deleteNotification = async (id: number) => {
        const success = await deleteNotificationApi(id)
        if (success) {
            setNotifications((prev) => prev.filter((n) => n.id !== id))
        }
    }

    const markAllAsRead = async () => {
        const success = await markAllNotificationsAsRead()
        if (success) {
            setNotifications((prev) =>
                prev.map((n) => (n.status === NotificationStatus.UNREAD ? { ...n, status: NotificationStatus.READ } : n))
            )
        }
    }

    // Computed values
    const unreadCount = notifications.filter(n => n.status === NotificationStatus.UNREAD).length

    // Auto-refresh notifications every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            loadNotifications()
        }, 30000)

        return () => clearInterval(interval)
    }, [loadNotifications])

    const value: NotificationsContextType = {
        notifications,
        loading,
        error,
        unreadCount,
        loadNotifications,
        markAsRead,
        markAsUnread,
        archiveNotification,
        unarchiveNotification,
        deleteNotification,
        markAllAsRead,
    }

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationsContext)
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider')
    }
    return context
}
