"use client"

import { 
  fetchActivities, 
  fetchActivityDetail, 
  fetchTrainers,
  newActivity,
  editActivityBack,
  deleteActivity,
  enrollActivity,
  unenrollActivity,
  markAttendance
} from "@/api/activities/activitiesApi"
import { useAuth } from "@/components/providers/auth-provider"
import { 
  ActivityType, 
  ActivityDetailInfo, 
  ActivityFormType, 
  UserType, 
  AttendanceStatus,
  EnrollmentStatus
} from "@/lib/types"
import { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/**
 * Tipos para el estado del hook
 */
interface ActivityLoadingStates {
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isEnrolling: boolean
  isUnenrolling: boolean
  isMarkingAttendance: boolean
}

interface ActivityMutationResult {
  success: boolean
  message: string
}

/**
 * Custom Hook para manejar todo el estado y lógica de actividades
 * Centraliza toda la lógica de negocio y estado en un solo lugar
 */
export function useActivity() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // Estado del formulario
  const [form, setForm] = useState<ActivityFormType>({
    name: "",
    description: "",
    location: "",
    trainerId: "",
    date: "",
    time: "",
    duration: "",
    maxParticipants: "",
    isRecurring: false,
  })

  // Verificación de permisos
  const isAdmin = user?.role === 'ADMIN'
  const isTrainer = user?.role === 'TRAINER'
  const canManageActivities = isAdmin || isTrainer

  // ===============================
  // QUERIES (Consultas de datos)
  // ===============================

  // Query para todas las actividades
  const {
    data: activities = [],
    isLoading: isLoadingActivities,
    error: activitiesError,
    refetch: refetchActivities,
  } = useQuery<ActivityType[]>({
    queryKey: ['activities'],
    queryFn: fetchActivities,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  })

  // Query para detalles de actividad seleccionada
  const {
    data: selectedActivity = null,
    isLoading: isLoadingActivityDetail,
  } = useQuery<ActivityDetailInfo | null>({
    queryKey: ['activity-detail'],
    queryFn: () => null, // Se maneja manualmente
    enabled: false,
  })

  // Query para entrenadores
  const {
    data: trainers = [],
    isLoading: isLoadingTrainers,
    refetch: refetchTrainers,
  } = useQuery<UserType[]>({
    queryKey: ['trainers'],
    queryFn: fetchTrainers,
    enabled: canManageActivities,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 1,
  })

  // ===============================
  // MUTATIONS (Modificaciones de datos)
  // ===============================

  const createActivityMutation = useMutation({
    mutationFn: (activity: Omit<ActivityFormType, 'id'>) => newActivity(activity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, activity }: { id: number; activity: Omit<ActivityFormType, 'id'> }) =>
      editActivityBack({ ...activity, id: id.toString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['activity-detail'] })
    },
  })

  const deleteActivityMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.setQueryData(['activity-detail'], null)
    },
  })

  const enrollMutation = useMutation({
    mutationFn: ({ activityId, userId }: { activityId: number; userId: number }) =>
      enrollActivity({ 
        activityId, 
        userId, 
        status: AttendanceStatus.PENDING,
        createdAt: new Date()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['activity-detail'] })
    },
  })

  const unenrollMutation = useMutation({
    mutationFn: ({ activityId, userId }: { activityId: number; userId: number }) =>
      unenrollActivity({ 
        activityId, 
        userId, 
        status: AttendanceStatus.PENDING,
        createdAt: new Date()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['activity-detail'] })
    },
  })

  const markAttendanceMutation = useMutation({
    mutationFn: ({ activityId, participantId, status }: { 
      activityId: number; 
      participantId: number; 
      status: AttendanceStatus 
    }) => markAttendance(activityId, participantId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['activity-detail'] })
    },
  })

  // ===============================
  // FUNCIONES DE UTILIDAD
  // ===============================

  // Función para resetear el formulario
  const resetForm = useCallback(() => {
    setForm({
      name: "",
      description: "",
      location: "",
      trainerId: "",
      date: "",
      time: "",
      duration: "",
      maxParticipants: "",
      isRecurring: false,
    })
  }, [])

  // Función para verificar si un usuario está inscrito
  const isUserEnrolled = useCallback((activity: ActivityType, userId: number): boolean => {
    return activity.participants.includes(userId)
  }, [])

  // Función para obtener el estado de inscripción de un usuario
  const getUserEnrollmentStatus = useCallback((activity: ActivityType, userId: number): EnrollmentStatus => {
    if (activity.participants.includes(userId)) {
      return EnrollmentStatus.ENROLLED
    }
    if (activity.currentParticipants >= activity.maxParticipants) {
      return EnrollmentStatus.FULL
    }
    return EnrollmentStatus.NOT_ENROLLED
  }, [])

  // Función para verificar si un usuario puede inscribirse
  const canUserEnroll = useCallback((activity: ActivityType, userId: number): boolean => {
    if (isUserEnrolled(activity, userId)) {
      return false
    }
    return activity.currentParticipants < activity.maxParticipants
  }, [isUserEnrolled])

  // Función para filtrar actividades por semana
  const getActivitiesByWeek = useCallback((weekStartDate: Date): ActivityType[] => {
    if (!activities.length) return []
    
    const weekStart = new Date(weekStartDate)
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStartDate)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    return activities.filter(activity => {
      const activityDate = new Date(activity.date)
      return activityDate >= weekStart && activityDate <= weekEnd
    })
  }, [activities])

  // Función para obtener actividades de hoy
  const getTodayActivities = useCallback((): ActivityType[] => {
    if (!activities.length) return []
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return activities.filter(activity => {
      const activityDate = new Date(activity.date)
      return activityDate >= today && activityDate < tomorrow
    })
  }, [activities])

  // Función para obtener las fechas de una semana (Lunes a Domingo)
  const getWeekDates = useCallback((startDate: Date): Date[] => {
    const dates = []
    const monday = new Date(startDate)
    const diffToMonday = (monday.getDay() + 6) % 7 // Convertir domingo=0 a domingo=6, lunes=1 a lunes=0
    monday.setDate(monday.getDate() - diffToMonday) // Lunes de la semana actual

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    return dates
  }, [])

  // ===============================
  // FUNCIONES DE MANIPULACIÓN DE DATOS
  // ===============================

  // Función para cargar detalles de una actividad
  const loadActivityDetail = useCallback(async (id: number): Promise<void> => {
    try {
      const activityDetail = await fetchActivityDetail(id)
      queryClient.setQueryData(['activity-detail'], activityDetail)
    } catch (error) {
      console.error("Error loading activity detail:", error)
      throw error
    }
  }, [queryClient])

  // Función para refrescar actividades
  const refreshActivities = useCallback(async (): Promise<void> => {
    await refetchActivities()
  }, [refetchActivities])

  // Función para cargar actividades por semana (mantiene compatibilidad)
  const loadActivitiesByWeek = useCallback(async (date: Date): Promise<void> => {
    // Solo refresca las actividades, el filtrado se hace en getActivitiesByWeek
    await refreshActivities()
  }, [refreshActivities])

  // Función para cargar entrenadores
  const loadTrainers = useCallback(async (): Promise<void> => {
    await refetchTrainers()
  }, [refetchTrainers])

  // Función para limpiar actividad seleccionada
  const clearSelectedActivity = useCallback((): void => {
    queryClient.setQueryData(['activity-detail'], null)
  }, [queryClient])

  // Función para establecer actividades directamente
  const setActivities = useCallback((activities: ActivityType[]): void => {
    queryClient.setQueryData(['activities'], activities)
  }, [queryClient])

  // ===============================
  // FUNCIONES WRAPPER PARA MUTACIONES
  // ===============================

  const createActivity = useCallback(async (activity: Omit<ActivityFormType, 'id'>): Promise<ActivityType> => {
    if (!canManageActivities) {
      throw new Error("No tienes permisos para crear actividades")
    }
    return createActivityMutation.mutateAsync(activity)
  }, [createActivityMutation, canManageActivities])

  const updateActivity = useCallback(async (id: number, activity: Omit<ActivityFormType, 'id'>): Promise<ActivityType> => {
    if (!canManageActivities) {
      throw new Error("No tienes permisos para editar actividades")
    }
    return updateActivityMutation.mutateAsync({ id, activity })
  }, [updateActivityMutation, canManageActivities])

  const removeActivity = useCallback(async (id: number): Promise<ActivityMutationResult> => {
    if (!canManageActivities) {
      throw new Error("No tienes permisos para eliminar actividades")
    }
    
    try {
      await deleteActivityMutation.mutateAsync(id)
      return { success: true, message: "Actividad eliminada exitosamente" }
    } catch (error) {
      return { success: false, message: "Error al eliminar la actividad" }
    }
  }, [deleteActivityMutation, canManageActivities])

  const enrollInActivity = useCallback(async (activityId: number, userId: number): Promise<ActivityMutationResult> => {
    if (!user) {
      throw new Error("Usuario no autenticado")
    }
    
    // Solo el propio usuario o un admin/trainer puede inscribir
    if (user.id !== userId && !canManageActivities) {
      throw new Error("No tienes permisos para inscribir a este usuario")
    }
    
    try {
      await enrollMutation.mutateAsync({ activityId, userId })
      return { success: true, message: "Inscripción exitosa" }
    } catch (error) {
      return { success: false, message: "Error al inscribirse en la actividad" }
    }
  }, [enrollMutation, user, canManageActivities])

  const unenrollFromActivity = useCallback(async (activityId: number, userId: number): Promise<ActivityMutationResult> => {
    if (!user) {
      throw new Error("Usuario no autenticado")
    }
    
    // Solo el propio usuario o un admin/trainer puede desinscribir
    if (user.id !== userId && !canManageActivities) {
      throw new Error("No tienes permisos para desinscribir a este usuario")
    }
    
    try {
      await unenrollMutation.mutateAsync({ activityId, userId })
      return { success: true, message: "Desinscripción exitosa" }
    } catch (error) {
      return { success: false, message: "Error al cancelar la inscripción" }
    }
  }, [unenrollMutation, user, canManageActivities])

  const markParticipantAttendance = useCallback(async (
    activityId: number, 
    participantId: number, 
    status: AttendanceStatus
  ): Promise<ActivityMutationResult> => {
    if (!canManageActivities) {
      throw new Error("No tienes permisos para marcar asistencia")
    }
    
    try {
      await markAttendanceMutation.mutateAsync({ activityId, participantId, status })
      return { success: true, message: "Asistencia marcada exitosamente" }
    } catch (error) {
      return { success: false, message: "Error al marcar asistencia" }
    }
  }, [markAttendanceMutation, canManageActivities])

  // ===============================
  // ESTADOS COMPUTADOS
  // ===============================

  // Estado de carga consolidado
  const isLoading = useMemo(() => 
    isLoadingActivities || isLoadingTrainers || isLoadingActivityDetail, 
    [isLoadingActivities, isLoadingTrainers, isLoadingActivityDetail]
  )

  // Error consolidado
  const error = useMemo(() => 
    activitiesError?.message || null, 
    [activitiesError]
  )

  // Estados de carga específicos para mutaciones
  const loadingStates: ActivityLoadingStates = useMemo(() => ({
    isCreating: createActivityMutation.isPending,
    isUpdating: updateActivityMutation.isPending,
    isDeleting: deleteActivityMutation.isPending,
    isEnrolling: enrollMutation.isPending,
    isUnenrolling: unenrollMutation.isPending,
    isMarkingAttendance: markAttendanceMutation.isPending,
  }), [
    createActivityMutation.isPending,
    updateActivityMutation.isPending,
    deleteActivityMutation.isPending,
    enrollMutation.isPending,
    unenrollMutation.isPending,
    markAttendanceMutation.isPending,
  ])

  // ===============================
  // RETORNO DEL HOOK
  // ===============================

  return {
    // Data
    activities,
    selectedActivity,
    trainers,
    
    // Form state
    form,
    setForm,
    resetForm,
    
    // Loading states
    isLoading,
    error,
    loading: isLoading, // Alias para compatibilidad
    ...loadingStates,
    
    // Mutations
    createActivity,
    updateActivity,
    removeActivity,
    enrollInActivity,
    unenrollFromActivity,
    markParticipantAttendance,
    
    // Data fetching
    loadActivitiesByWeek,
    loadActivityDetail,
    refreshActivities,
    loadTrainers,
    clearSelectedActivity,
    setActivities,
    
    // Utility functions
    isUserEnrolled,
    getUserEnrollmentStatus,
    canUserEnroll,
    getActivitiesByWeek,
    getTodayActivities,
    getWeekDates,
    
    // Permission checks
    canManageActivities,
    isAdmin,
    isTrainer,
  }
}

export type ActivityState = ReturnType<typeof useActivity>
