"use client"

import { useActivity, type ActivityState } from "@/hooks/use-activity"
import { createContext, useContext, type ReactNode } from "react"

/**
 * Context type - usa exactamente el mismo tipo que retorna el hook
 */
type ActivityContextType = ActivityState

/**
 * Creación del contexto
 */
const ActivityContext = createContext<ActivityContextType | undefined>(undefined)

/**
 * Props del provider
 */
interface ActivityProviderProps {
  children: ReactNode
}

/**
 * Activity Provider - Wrapper limpio que usa el custom hook
 * 
 * Este provider es responsable de:
 * - Usar el custom hook useActivityState para obtener toda la lógica
 * - Proveer el estado a través del contexto
 * - Mantener la separación de responsabilidades
 */
export function ActivityProvider({ children }: ActivityProviderProps) {
  // Usa el custom hook que maneja toda la lógica
  const activityState = useActivity()

  return (
    <ActivityContext.Provider value={activityState}>
      {children}
    </ActivityContext.Provider>
  )
}

/**
 * Hook personalizado para usar el contexto de actividades
 * 
 * @throws Error si se usa fuera del ActivityProvider
 * @returns ActivityState - Todo el estado y funciones de actividades
 */
export function useActivityContext(): ActivityContextType {
  const context = useContext(ActivityContext)
  
  if (context === undefined) {
    throw new Error('useActivity debe ser usado dentro de un ActivityProvider')
  }
  
  return context
}

/**
 * Hook de compatibilidad con el código existente
 * @deprecated Usar useActivity en su lugar
 */
export function useActivities(): ActivityContextType {
  return useActivity()
}
