"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { getUnreadCount } from "@/api/notifications/notificationsApi"

interface NotificationsContextType {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = async () => {
    if (user?.id) {
      try {
        const count = await getUnreadCount(user.id)
        setUnreadCount(count)
      } catch (error) {
        console.error('Error fetching unread count:', error)
        setUnreadCount(0)
      }
    }
  }

  const refreshUnreadCount = async () => {
    await fetchUnreadCount()
  }

  useEffect(() => {
    fetchUnreadCount()
  }, [user?.id])

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshUnreadCount }}>
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
