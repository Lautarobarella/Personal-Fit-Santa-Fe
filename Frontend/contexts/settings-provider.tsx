"use client"

import { useSettings, type SettingsState } from "@/hooks/settings/use-settings"
import { createContext, useContext, type ReactNode } from "react"

/**
 * Context type - usa exactamente el mismo tipo que retorna el hook
 */
type SettingsContextType = SettingsState

/**
 * Creación del contexto
 */
const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

/**
 * Props del provider
 */
interface SettingsProviderProps {
  children: ReactNode
}

/**
 * Settings Provider - Wrapper limpio que usa el custom hook
 * 
 * Este provider es responsable de:
 * - Usar el custom hook useSettings para obtener toda la lógica
 * - Proveer el estado a través del contexto
 * - Mantener la separación de responsabilidades
 */
export function SettingsProvider({ children }: SettingsProviderProps) {
  // Usa el custom hook que maneja toda la lógica
  const settingsState = useSettings()

  return (
    <SettingsContext.Provider value={settingsState}>
      {children}
    </SettingsContext.Provider>
  )
}

/**
 * Hook personalizado para usar el contexto de configuraciones
 * 
 * @throws Error si se usa fuera del SettingsProvider
 * @returns SettingsState - Todo el estado y funciones de configuraciones
 */
export function useSettingsContext(): SettingsContextType {
  const context = useContext(SettingsContext)
  
  if (context === undefined) {
    throw new Error('useSettingsContext debe ser usado dentro de un SettingsProvider')
  }
  
  return context
}
