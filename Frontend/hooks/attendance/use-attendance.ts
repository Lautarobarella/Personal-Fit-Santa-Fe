"use client"

import { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { 
  fetchActivityAttendances, 
  fetchActivityAttendancesWithUserInfo,
  fetchUserAttendances, 
  updateAttendanceStatus, 
  enrollUserInActivity, 
  unenrollUserFromActivity 
} from "@/api/attendance/attendanceApi"
import { AttendanceType, AttendanceStatus } from "@/lib/types"
import { useAuth } from "@/contexts/auth-provider"

/**
 * Tipos para el estado del hook
 */
interface AttendanceLoadingStates {
  isLoadingAttendances: boolean
  isUpdating: boolean
  isEnrolling: boolean
  isUnenrolling: boolean
}

interface AttendanceMutationResult {
  success: boolean
  message: string
}

/**
 * Custom Hook para manejar todo el estado y lógica de asistencias
 * Centraliza toda la lógica de attendance en un solo lugar
 */
export function useAttendance() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // Estado para la actividad seleccionada
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null)

  // Verificación de permisos
  const isAdmin = user?.role === 'ADMIN'
  const isTrainer = user?.role === 'TRAINER'
  const canManageAttendances = isAdmin || isTrainer

  // ===============================
  // QUERIES (Consultas de datos)
  // ===============================

  // Query para asistencias de una actividad específica con información de usuario
  const {
    data: activityAttendances = [],
    isLoading: isLoadingActivityAttendances,
    error: attendancesError,
    refetch: refetchActivityAttendances,
  } = useQuery<AttendanceType[]>({
    queryKey: ['activity-attendances', selectedActivityId],
    queryFn: () => selectedActivityId ? fetchActivityAttendancesWithUserInfo(selectedActivityId) : Promise.resolve([]),
    enabled: !!selectedActivityId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 1,
  })

  // Query para asistencias de un usuario específico
  const {
    data: userAttendances = [],
    isLoading: isLoadingUserAttendances,
    refetch: refetchUserAttendances,
  } = useQuery<AttendanceType[]>({
    queryKey: ['user-attendances', user?.id],
    queryFn: () => user?.id ? fetchUserAttendances(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  })

  // ===============================
  // MUTATIONS (Modificaciones de datos)
  // ===============================

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ attendanceId, status }: { attendanceId: number; status: AttendanceStatus }) =>
      updateAttendanceStatus(attendanceId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-attendances'] })
      queryClient.invalidateQueries({ queryKey: ['activities'] }) // Para actualizar los contadores
    },
  })

  const enrollMutation = useMutation({
    mutationFn: ({ userId, activityId }: { userId: number; activityId: number }) =>
      enrollUserInActivity(userId, activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-attendances'] })
      queryClient.invalidateQueries({ queryKey: ['user-attendances'] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })

  const unenrollMutation = useMutation({
    mutationFn: ({ userId, activityId }: { userId: number; activityId: number }) =>
      unenrollUserFromActivity(userId, activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-attendances'] })
      queryClient.invalidateQueries({ queryKey: ['user-attendances'] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })

  // ===============================
  // FUNCIONES DE UTILIDAD
  // ===============================

  // Función para obtener estadísticas de asistencia de una actividad
  const getAttendanceStats = useCallback(() => {
    if (!activityAttendances.length) {
      return {
        present: 0,
        absent: 0,
        late: 0,
        pending: 0,
        total: 0
      }
    }

    return {
      present: activityAttendances.filter(a => a.status === AttendanceStatus.PRESENT).length,
      absent: activityAttendances.filter(a => a.status === AttendanceStatus.ABSENT).length,
      late: activityAttendances.filter(a => a.status === AttendanceStatus.LATE).length,
      pending: activityAttendances.filter(a => a.status === AttendanceStatus.PENDING).length,
      total: activityAttendances.length
    }
  }, [activityAttendances])

  // Función para verificar si un usuario está inscrito en la actividad actual
  const isUserEnrolledInCurrentActivity = useCallback((userId: number): boolean => {
    return activityAttendances.some(attendance => attendance.userId === userId)
  }, [activityAttendances])

  // Función para obtener la asistencia de un usuario específico
  const getUserAttendance = useCallback((userId: number): AttendanceType | undefined => {
    return activityAttendances.find(attendance => attendance.userId === userId)
  }, [activityAttendances])

  // ===============================
  // FUNCIONES DE MANIPULACIÓN DE DATOS
  // ===============================

  // Función para cargar asistencias de una actividad
  const loadActivityAttendances = useCallback(async (activityId: number): Promise<void> => {
    setSelectedActivityId(activityId)
    // La query se ejecutará automáticamente cuando selectedActivityId cambie
  }, [])

  // Función para refrescar asistencias de la actividad actual
  const refreshActivityAttendances = useCallback(async (): Promise<void> => {
    await refetchActivityAttendances()
  }, [refetchActivityAttendances])

  // Función para refrescar asistencias del usuario
  const refreshUserAttendances = useCallback(async (): Promise<void> => {
    await refetchUserAttendances()
  }, [refetchUserAttendances])

  // Función para limpiar la actividad seleccionada
  const clearSelectedActivity = useCallback((): void => {
    setSelectedActivityId(null)
  }, [])

  // ===============================
  // FUNCIONES WRAPPER PARA MUTACIONES
  // ===============================

  const markAttendance = useCallback(async (
    attendanceId: number, 
    status: AttendanceStatus
  ): Promise<AttendanceMutationResult> => {
    if (!canManageAttendances) {
      throw new Error("No tienes permisos para marcar asistencia")
    }
    
    try {
      await updateAttendanceMutation.mutateAsync({ attendanceId, status })
      return { success: true, message: "Asistencia actualizada exitosamente" }
    } catch (error) {
      return { success: false, message: "Error al actualizar la asistencia" }
    }
  }, [updateAttendanceMutation, canManageAttendances])

  const enrollUser = useCallback(async (
    userId: number, 
    activityId: number
  ): Promise<AttendanceMutationResult> => {
    if (!user) {
      throw new Error("Usuario no autenticado")
    }
    
    // Solo el propio usuario o un admin/trainer puede inscribir
    if (user.id !== userId && !canManageAttendances) {
      throw new Error("No tienes permisos para inscribir a este usuario")
    }
    
    try {
      await enrollMutation.mutateAsync({ userId, activityId })
      return { success: true, message: "Usuario inscrito exitosamente" }
    } catch (error) {
      return { success: false, message: "Error al inscribir al usuario" }
    }
  }, [enrollMutation, user, canManageAttendances])

  const unenrollUser = useCallback(async (
    userId: number, 
    activityId: number
  ): Promise<AttendanceMutationResult> => {
    if (!user) {
      throw new Error("Usuario no autenticado")
    }
    
    // Solo el propio usuario o un admin/trainer puede desinscribir
    if (user.id !== userId && !canManageAttendances) {
      throw new Error("No tienes permisos para desinscribir a este usuario")
    }
    
    try {
      await unenrollMutation.mutateAsync({ userId, activityId })
      return { success: true, message: "Usuario desinscrito exitosamente" }
    } catch (error) {
      return { success: false, message: "Error al desinscribir al usuario" }
    }
  }, [unenrollMutation, user, canManageAttendances])

  // ===============================
  // ESTADOS COMPUTADOS
  // ===============================

  // Estado de carga consolidado
  const isLoading = useMemo(() => 
    isLoadingActivityAttendances || isLoadingUserAttendances, 
    [isLoadingActivityAttendances, isLoadingUserAttendances]
  )

  // Error consolidado
  const error = useMemo(() => 
    attendancesError?.message || null, 
    [attendancesError]
  )

  // Estados de carga específicos para mutaciones
  const loadingStates: AttendanceLoadingStates = useMemo(() => ({
    isLoadingAttendances: isLoadingActivityAttendances,
    isUpdating: updateAttendanceMutation.isPending,
    isEnrolling: enrollMutation.isPending,
    isUnenrolling: unenrollMutation.isPending,
  }), [
    isLoadingActivityAttendances,
    updateAttendanceMutation.isPending,
    enrollMutation.isPending,
    unenrollMutation.isPending,
  ])

  // ===============================
  // RETORNO DEL HOOK
  // ===============================

  return {
    // Data
    activityAttendances,
    userAttendances,
    selectedActivityId,
    
    // Loading states
    isLoading,
    error,
    ...loadingStates,
    
    // Mutations
    markAttendance,
    enrollUser,
    unenrollUser,
    
    // Data fetching
    loadActivityAttendances,
    refreshActivityAttendances,
    refreshUserAttendances,
    clearSelectedActivity,
    
    // Utility functions
    getAttendanceStats,
    isUserEnrolledInCurrentActivity,
    getUserAttendance,
    
    // Permission checks
    canManageAttendances,
    isAdmin,
    isTrainer,
  }
}

export type AttendanceState = ReturnType<typeof useAttendance>
