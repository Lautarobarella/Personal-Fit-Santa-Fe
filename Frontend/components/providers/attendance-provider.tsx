"use client"

import { useAttendance, type AttendanceState } from "@/hooks/use-attendance"
import { createContext, useContext, type ReactNode } from "react"

/**
 * Context type - usa exactamente el mismo tipo que retorna el hook
 */
type AttendanceContextType = AttendanceState

/**
 * Creación del contexto
 */
const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined)

/**
 * Props del provider
 */
interface AttendanceProviderProps {
  children: ReactNode
}

/**
 * Attendance Provider - Wrapper limpio que usa el custom hook
 * 
 * Este provider es responsable de:
 * - Usar el custom hook useAttendance para obtener toda la lógica
 * - Proveer el estado a través del contexto
 * - Mantener la separación de responsabilidades
 */
export function AttendanceProvider({ children }: AttendanceProviderProps) {
  // Usa el custom hook que maneja toda la lógica
  const attendanceState = useAttendance()

  return (
    <AttendanceContext.Provider value={attendanceState}>
      {children}
    </AttendanceContext.Provider>
  )
}

/**
 * Hook personalizado para usar el contexto de asistencias
 * 
 * @throws Error si se usa fuera del AttendanceProvider
 * @returns AttendanceState - Todo el estado y funciones de asistencias
 */
export function useAttendanceContext(): AttendanceContextType {
  const context = useContext(AttendanceContext)
  
  if (context === undefined) {
    throw new Error('useAttendanceContext debe ser usado dentro de un AttendanceProvider')
  }
  
  return context
}
