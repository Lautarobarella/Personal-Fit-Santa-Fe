"use client"

import { useNotification, type NotificationState } from "@/hooks/notifications/use-notification"
import { createContext, useContext, type ReactNode } from "react"

/**
 * Context type - usa exactamente el mismo tipo que retorna el hook
 */
type NotificationContextType = NotificationState

/**
 * Creación del contexto
 */
const NotificationsContext = createContext<NotificationContextType | undefined>(undefined)

/**
 * Props del provider
 */
interface NotificationsProviderProps {
  children: ReactNode
}

/**
 * Notifications Provider - Wrapper limpio que usa el custom hook
 */
export function NotificationsProvider({ children }: NotificationsProviderProps) {
  // Usa el custom hook que maneja toda la lógica
  const notificationState = useNotification()

  return (
    <NotificationsContext.Provider value={notificationState}>
      {children}
    </NotificationsContext.Provider>
  )
}

/**
 * Hook personalizado para usar el contexto de notificaciones
 */
export function useNotificationsContext() {
  const context = useContext(NotificationsContext)

  if (context === undefined) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider')
  }

  return context
}