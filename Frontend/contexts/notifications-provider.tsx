"use client"

import { useNotification, type NotificationState } from "@/hooks/notifications/use-notification"
import { createContext, useContext, type ReactNode } from "react"

/**
 * Context type - usa exactamente el mismo tipo que retorna el hook
 */
type NotificationsContextType = NotificationState

/**
 * Creación del contexto
 */
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

/**
 * Props del provider
 */
interface NotificationsProviderProps {
  children: ReactNode
}

/**
 * Notifications Provider - Wrapper limpio que usa el custom hook
 * 
 * Este provider es responsable de:
 * - Usar el custom hook useNotification para obtener toda la lógica
 * - Proveer el estado a través del contexto
 * - Mantener la separación de responsabilidades
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
 * 
 * @throws Error si se usa fuera del NotificationsProvider
 * @returns NotificationState - Todo el estado y funciones de notificaciones
 */
export function useNotifications(): NotificationsContextType {
  const context = useContext(NotificationsContext)
  
  if (context === undefined) {
    throw new Error('useNotifications debe ser usado dentro de un NotificationsProvider')
  }
  
  return context
}
