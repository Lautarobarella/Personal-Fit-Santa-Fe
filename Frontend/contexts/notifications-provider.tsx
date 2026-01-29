"use client"

import { useNotification, type NotificationState } from "@/hooks/notifications/use-notification"
import { createContext, useContext, type ReactNode } from "react"
import { useFCM } from "@/hooks/useFCM"

/**
 * Notification Context Interface
 * Maps directly to the `useNotification` hook return type.
 */
type NotificationContextType = NotificationState

// Context Initialization
const NotificationsContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationsProviderProps {
  children: ReactNode
}

/**
 * Notifications Provider
 * 
 * Architectural Role:
 * 1. Global state for In-App Notifications (bell icon list).
 * 2. Hoster for the Push Notification side-effects (`useFCM`).
 * 
 * By placing `useFCM()` here, we ensure that Push Notification listeners 
 * are active as long as the application is mounted, without needing
 * to pollute the layout or root component.
 */
export function NotificationsProvider({ children }: NotificationsProviderProps) {
  // Core business logic for fetching/managing database notifications
  const notificationState = useNotification()

  // Side Effect: Initialize Firebase Cloud Messaging
  // Registers Service Worker and listeners for incoming push messages
  useFCM()

  return (
    <NotificationsContext.Provider value={notificationState}>
      {children}
    </NotificationsContext.Provider>
  )
}

/**
 * useNotificationsContext Hook
 * 
 * Accessor for the Notification Context.
 * 
 * @throws Error if used outside of <NotificationsProvider />
 */
export function useNotificationsContext() {
  const context = useContext(NotificationsContext)

  if (context === undefined) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider')
  }

  return context
}