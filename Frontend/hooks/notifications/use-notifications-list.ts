"use client"

import { useNotificationsContext } from "@/contexts/notifications-provider"
import { NotificationStatus } from "@/lib/types"

export function useNotificationsList(
  filterStatus: NotificationStatus | "all" = "all",
  searchTerm: string = "",
) {
  const {
    notifications,
    isLoadingNotifications: isLoading,
    markAsRead,
    archiveNotification,
    deleteNotification,
  } = useNotificationsContext()

  const statusFilteredNotifications = filterStatus === "all"
    ? notifications
    : notifications.filter(n => n.status === filterStatus)

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  const filteredNotifications = normalizedSearchTerm
    ? statusFilteredNotifications.filter((notification) =>
        notification.title.toLowerCase().includes(normalizedSearchTerm) ||
        notification.message.toLowerCase().includes(normalizedSearchTerm),
      )
    : statusFilteredNotifications

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id)
  }

  const handleArchive = async (id: number) => {
    await archiveNotification(id)
  }

  const handleDelete = async (id: number) => {
    await deleteNotification(id)
  }

  return {
    filteredNotifications,
    isLoading,
    handleMarkAsRead,
    handleArchive,
    handleDelete,
  }
}
