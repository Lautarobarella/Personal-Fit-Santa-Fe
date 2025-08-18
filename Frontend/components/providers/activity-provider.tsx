"use client"

import React, { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import {
  fetchActivities,
  fetchActivitiesByDate,
  fetchActivityDetail,
  newActivity,
  editActivityBack,
  deleteActivity,
  enrollActivity,
  unenrollActivity,
  fetchTrainers,
  markAttendance,
} from '@/api/activities/activitiesApi'
import {
  ActivityType,
  ActivityDetailInfo,
  ActivityFormType,
  UserType,
  EnrollmentRequest,
  AttendanceStatus,
} from '@/lib/types'
import { useAuth } from './auth-provider'

// Interfaces para el contexto
interface ActivityContextType {
  // Queries
  activities: ActivityType[]
  selectedActivity: ActivityDetailInfo | null
  trainers: UserType[]
  
  // Form state
  form: ActivityFormType
  setForm: React.Dispatch<React.SetStateAction<ActivityFormType>>
  resetForm: () => void
  
  // Query states
  isLoading: boolean
  error: string | null
  loading: boolean // Alias para compatibilidad
  
  // Mutations
  createActivity: (activity: Omit<ActivityFormType, 'id'>) => Promise<ActivityType>
  updateActivity: (id: number, activity: Omit<ActivityFormType, 'id'>) => Promise<ActivityType>
  removeActivity: (id: number) => Promise<{ success: boolean; message: string }>
  enrollInActivity: (activityId: number, userId: number) => Promise<{ success: boolean; message: string }>
  unenrollFromActivity: (activityId: number, userId: number) => Promise<{ success: boolean; message: string }>
  markParticipantAttendance: (activityId: number, participantId: number, status: AttendanceStatus) => Promise<{ success: boolean; message: string }>
  
  // Data fetching
  loadActivitiesByWeek: (date: Date) => Promise<void>
  loadActivityDetail: (id: number) => Promise<void>
  refreshActivities: () => Promise<void>
  loadTrainers: () => Promise<void>
  clearSelectedActivity: () => void
  setActivities: (activities: ActivityType[]) => void
  
  // Utility functions
  isUserEnrolled: (activity: ActivityType, userId: number) => boolean
  getUserEnrollmentStatus: (activity: ActivityType, userId: number) => "enrolled" | "not_enrolled" | "full"
  canUserEnroll: (activity: ActivityType, userId: number) => boolean
  getActivitiesByWeek: (weekStartDate: Date) => ActivityType[]
  getTodayActivities: () => ActivityType[]
  
  // Loading states for specific operations
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isEnrolling: boolean
  isUnenrolling: boolean
  isMarkingAttendance: boolean
  
  // Aliases para compatibilidad con código existente
  deleteActivityById: (id: number) => Promise<{ success: boolean; message: string }>
  enrollIntoActivity: (activityId: number, userId: number) => Promise<{ success: boolean; message: string }>
  markParticipantPresent: (activityId: number, participantId: number, status: AttendanceStatus) => Promise<{ success: boolean; message: string }>
  editActivity: (id: number, activity: Omit<ActivityFormType, 'id'>) => Promise<ActivityType>
  loadActivities: () => Promise<void>
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined)

// Provider props
interface ActivityProviderProps {
  children: ReactNode
}

export function ActivityProvider({ children }: ActivityProviderProps) {
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
    weeklySchedule: [false, false, false, false, false, false, false],
  })
  
  // Verificar permisos de usuario
  const isAdmin = user?.role === 'ADMIN'
  const isTrainer = user?.role === 'TRAINER'
  const canManageActivities = isAdmin || isTrainer

  // Query para todas las actividades (sin filtrado)
  const {
    data: activities = [],
    isLoading: isLoadingActivities,
    error: activitiesError,
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
  } = useQuery<ActivityDetailInfo | null>({
    queryKey: ['activity-detail'],
    queryFn: () => null, // Se maneja manualmente
    enabled: false,
  })

  // Query para entrenadores
  const {
    data: trainers = [],
    isLoading: isLoadingTrainers,
  } = useQuery<UserType[]>({
    queryKey: ['trainers'],
    queryFn: fetchTrainers,
    enabled: canManageActivities,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 1,
  })

  // Mutaciones
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

  // Funciones auxiliares
  const loadActivitiesByWeek = async (date: Date) => {
    // Esta función ahora solo refresca las actividades
    // El filtrado por semana lo hace cada página individualmente
    await queryClient.invalidateQueries({ queryKey: ['activities'] })
  }

  const loadActivityDetail = async (id: number) => {
    try {
      const detail = await fetchActivityDetail(id)
      queryClient.setQueryData(['activity-detail'], detail)
    } catch (error) {
      console.error('Error loading activity detail:', error)
      throw error
    }
  }

  const refreshActivities = async () => {
    await queryClient.invalidateQueries({ queryKey: ['activities'] })
  }
  
  const loadTrainers = async () => {
    // Los trainers se cargan automáticamente mediante useQuery
    await queryClient.invalidateQueries({ queryKey: ['trainers'] })
  }
  
  const clearSelectedActivity = () => {
    queryClient.setQueryData(['activity-detail'], null)
  }
  
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
      weeklySchedule: [false, false, false, false, false, false, false],
    })
  }, [])
  
  const setActivities = (activities: ActivityType[]) => {
    queryClient.setQueryData(['activities'], activities)
  }

  // Función helper para filtrar actividades por semana
  const getActivitiesByWeek = useCallback((weekStartDate: Date): ActivityType[] => {
    if (!activities.length) return []
    
    const weekStart = new Date(weekStartDate)
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStartDate)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    return activities.filter(activity => {
      const activityDate = new Date(activity.date)
      activityDate.setHours(0, 0, 0, 0)
      
      return activityDate >= weekStart && activityDate <= weekEnd
    })
  }, [activities])

  // Función helper para obtener actividades de hoy
  const getTodayActivities = useCallback((): ActivityType[] => {
    if (!activities.length) return []
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return activities.filter(activity => {
      const activityDate = new Date(activity.date)
      activityDate.setHours(0, 0, 0, 0)
      
      return activityDate >= today && activityDate < tomorrow
    })
  }, [activities])

  // Funciones de utilidad
  const isUserEnrolled = (activity: ActivityType, userId: number): boolean => {
    return activity.participants.includes(userId)
  }

  const getUserEnrollmentStatus = (activity: ActivityType, userId: number): "enrolled" | "not_enrolled" | "full" => {
    if (activity.participants.includes(userId)) {
      return "enrolled"
    }
    if (activity.currentParticipants >= activity.maxParticipants) {
      return "full"
    }
    return "not_enrolled"
  }

  const canUserEnroll = (activity: ActivityType, userId: number): boolean => {
    if (isUserEnrolled(activity, userId)) {
      return false // Ya está inscrito
    }
    return activity.currentParticipants < activity.maxParticipants
  }

  // Funciones de wrapper para las mutaciones
  const createActivity = async (activity: Omit<ActivityFormType, 'id'>): Promise<ActivityType> => {
    if (!canManageActivities) {
      throw new Error('No tienes permisos para crear actividades')
    }
    return createActivityMutation.mutateAsync(activity)
  }

  const updateActivity = async (id: number, activity: Omit<ActivityFormType, 'id'>): Promise<ActivityType> => {
    if (!canManageActivities) {
      throw new Error('No tienes permisos para editar actividades')
    }
    return updateActivityMutation.mutateAsync({ id, activity })
  }

  const removeActivity = async (id: number): Promise<{ success: boolean; message: string }> => {
    if (!canManageActivities) {
      throw new Error('No tienes permisos para eliminar actividades')
    }
    
    try {
      await deleteActivityMutation.mutateAsync(id)
      return {
        success: true,
        message: 'Actividad eliminada exitosamente'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error al eliminar la actividad'
      }
    }
  }

  const enrollInActivity = async (activityId: number, userId: number): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      throw new Error('Usuario no autenticado')
    }
    
    // Solo el propio usuario o un admin/trainer puede inscribir
    if (user.id !== userId && !canManageActivities) {
      throw new Error('No tienes permisos para inscribir a este usuario')
    }
    
    try {
      await enrollMutation.mutateAsync({ activityId, userId })
      return {
        success: true,
        message: 'Inscripción exitosa'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error al inscribirse en la actividad'
      }
    }
  }

  const unenrollFromActivity = async (activityId: number, userId: number): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      throw new Error('Usuario no autenticado')
    }
    
    // Solo el propio usuario o un admin/trainer puede desinscribir
    if (user.id !== userId && !canManageActivities) {
      throw new Error('No tienes permisos para desinscribir a este usuario')
    }
    
    try {
      await unenrollMutation.mutateAsync({ activityId, userId })
      return {
        success: true,
        message: 'Desinscripción exitosa'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error al desinscribirse de la actividad'
      }
    }
  }

  const markParticipantAttendance = async (
    activityId: number, 
    participantId: number, 
    status: AttendanceStatus
  ): Promise<{ success: boolean; message: string }> => {
    if (!canManageActivities) {
      throw new Error('No tienes permisos para marcar asistencia')
    }
    
    try {
      await markAttendanceMutation.mutateAsync({ activityId, participantId, status })
      return {
        success: true,
        message: `Asistencia marcada como ${status === AttendanceStatus.PRESENT ? 'presente' : status === AttendanceStatus.ABSENT ? 'ausente' : 'tardanza'} exitosamente`
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error al marcar asistencia'
      }
    }
  }

  // Aliases para compatibilidad con el código existente
  const deleteActivityById = removeActivity
  const enrollIntoActivity = enrollInActivity
  const markParticipantPresent = markParticipantAttendance
  const editActivity = updateActivity
  const loadActivities = refreshActivities

  // Estado de carga consolidado
  const isLoading = isLoadingActivities || isLoadingTrainers

  // Error consolidado
  const error = activitiesError?.message || null

  const contextValue: ActivityContextType = {
    // Data
    activities,
    selectedActivity,
    trainers,
    
    // Form state
    form,
    setForm,
    resetForm,
    
    // States
    isLoading,
    error,
    
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
    
    // Utilities
    isUserEnrolled,
    getUserEnrollmentStatus,
    canUserEnroll,
    getActivitiesByWeek,
    getTodayActivities,
    
    // Loading states
    isCreating: createActivityMutation.isPending,
    isUpdating: updateActivityMutation.isPending,
    isDeleting: deleteActivityMutation.isPending,
    isEnrolling: enrollMutation.isPending,
    isUnenrolling: unenrollMutation.isPending,
    isMarkingAttendance: markAttendanceMutation.isPending,
    
    // Aliases para compatibilidad
    deleteActivityById,
    enrollIntoActivity,
    markParticipantPresent,
    editActivity,
    loadActivities,
    loading: isLoading, // Alias para compatibilidad
  }

  return (
    <ActivityContext.Provider value={contextValue}>
      {children}
    </ActivityContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export function useActivity() {
  const context = useContext(ActivityContext)
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider')
  }
  return context
}

// Hook para compatibilidad con el código existente
export function useActivities() {
  return useActivity()
}
