import React, { createContext, useContext, ReactNode } from "react"
import { useSimpleNotifications } from "./use-simple-notifications"

/**
 * Simple context type based on the clean hook
 */
type NotificationContextType = ReturnType<typeof useSimpleNotifications>

/**
 * Context creation
 */
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

/**
 * Provider props
 */
interface NotificationProviderProps {
  children: ReactNode
}

/**
 * Clean, minimal notification provider
 * Uses the simplified hook instead of complex state management
 */
export function CleanNotificationProvider({ children }: NotificationProviderProps) {
  const notificationState = useSimpleNotifications()

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}
    </NotificationContext.Provider>
  )
}

/**
 * Hook to use the notification context
 * 
 * @throws Error if used outside of CleanNotificationProvider
 * @returns All notification state and functions
 */
export function useCleanNotifications(): NotificationContextType {
  const context = useContext(NotificationContext)
  
  if (context === undefined) {
    throw new Error('useCleanNotifications must be used within a CleanNotificationProvider')
  }
  
  return context
}