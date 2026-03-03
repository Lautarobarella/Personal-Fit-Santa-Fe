"use client"

import { useState } from "react"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useNotificationsContext } from "@/contexts/notifications-provider"
import { useToast } from "@/hooks/use-toast"
import { NotificationStatus } from "@/types"

export function useNotificationsPage() {
  useRequireAuth()
  const { toast } = useToast()

  const {
    notifications,
    unreadCount,
    markAsRead,
    archiveNotification,
  } = useNotificationsContext()

  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(
      (notification) => notification.status === NotificationStatus.UNREAD
    )

    try {
      await Promise.all(unreadNotifications.map((notification) => markAsRead(notification.id)))
      toast({
        title: "Exito",
        description: `${unreadNotifications.length} notificaciones marcadas como leidas`,
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron marcar todas como leidas",
        variant: "destructive",
      })
    }
  }

  const handleArchiveAll = async () => {
    const allActiveNotifications = notifications.filter(
      (notification) => notification.status !== NotificationStatus.ARCHIVED
    )

    try {
      await Promise.all(allActiveNotifications.map((notification) => archiveNotification(notification.id)))
      toast({
        title: "Exito",
        description: `${allActiveNotifications.length} notificaciones archivadas`,
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron archivar todas las notificaciones",
        variant: "destructive",
      })
    }
  }

  const hasUnread = notifications.filter(
    (n) => n.status === NotificationStatus.UNREAD
  ).length > 0

  const hasActive = notifications.filter(
    (n) => n.status !== NotificationStatus.ARCHIVED
  ).length > 0

  return {
    notifications,
    unreadCount,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    handleMarkAllAsRead,
    handleArchiveAll,
    hasUnread,
    hasActive,
  }
}
