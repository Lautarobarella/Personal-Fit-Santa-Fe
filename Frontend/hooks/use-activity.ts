import {
    deleteActivity,
    editActivityBack,
    enrollActivity,
    fetchActivities,
    fetchActivitiesByDate,
    fetchActivityDetail,
    fetchTrainers,
    newActivity,
    unenrollActivity
} from "@/api/activities/activitiesApi"
import { AttendanceStatus, type ActivityDetailInfo, type ActivityFormType, type ActivityType, type EnrollmentRequest, type EnrollmentResponse, type UserType } from "@/lib/types"
import { useCallback, useState } from "react"

export function useActivities() {
  const [activities, setActivities] = useState<ActivityType[]>([])
  const [selectedActivity, setSelectedActivity] = useState<ActivityDetailInfo | null>(null)
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
    weeklySchedule: [false, false, false, false, false, false, false], // [lunes, martes, miércoles, jueves, viernes, sábado, domingo]
  })
  const [trainers, setTrainers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar todos los clientes
  const loadActivities = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchActivities()
      setActivities(data)
    } catch (err) {
      setError("Error al cargar las actividades")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadActivitiesByWeek = useCallback(async (date: Date) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchActivitiesByDate(date)
      // Reemplazar actividades completamente para evitar problemas con el domingo
      setActivities(data)
    } catch (err) {
      setError("Error al cargar las actividades")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTrainers = useCallback(async () => {
    try {
      const data = await fetchTrainers()
      setTrainers(data)
    } catch (err) {
      setError("Error al cargar las actividades")
    }
  }, [])

  // Cargar detalle de un cliente
  const loadActivityDetail = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const detail = await fetchActivityDetail(id)
      setSelectedActivity(detail)
    } catch (err) {
      setError("Error al cargar el detalle de la actividad")
    } finally {
      setLoading(false)
    }
  }, [])

  const createActivity = useCallback(async (activity: ActivityFormType) => {
    setLoading(true)
    setError(null)
    try {
      const response = await newActivity(activity) 
      // Recargar actividades después de crear una nueva
      await loadActivities()
      return response // Retornar la respuesta para que el componente pueda mostrar el mensaje
    } catch (err) {
      setError("Error al crear la actividad")
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadActivities])

  const editActivity = useCallback(async (activityId: number, activity: ActivityFormType) => {
    setLoading(true)
    setError(null)
    try {
      // Añadir el ID al objeto activity para la API
      const activityWithId = { ...activity, id: activityId.toString() }
      await editActivityBack(activityWithId)
      // Recargar actividades después de editar
      await loadActivities()
    } catch (err) {
      setError("Error al editar la actividad")
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadActivities])

  const deleteActivityById = useCallback(async (activityId: number) => {
    setLoading(true)
    setError(null)
    try {
      await deleteActivity(activityId)
      // Remove the deleted activity from the local state
      setActivities(prev => prev.filter(activity => activity.id !== activityId))
      return {
        success: true,
        message: "Actividad eliminada exitosamente"
      }
    } catch (err) {
      const errorMessage = "Error al eliminar la actividad"
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Función mejorada para inscribirse a una actividad
  const enrollIntoActivity = useCallback(async (activityId: number, userId: number): Promise<EnrollmentResponse> => {
    setLoading(true)
    setError(null)
    
    try {
      const enrollmentRequest: EnrollmentRequest = {
        activityId,
        userId,
        status: AttendanceStatus.PENDING,
        createdAt: new Date()
      }

      const response = await enrollActivity(enrollmentRequest)
      
      // Actualizar la lista de actividades localmente
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId 
            ? { 
                ...activity, 
                participants: [...activity.participants, userId],
                currentParticipants: activity.currentParticipants + 1
              }
            : activity
        )
      )

      return {
        success: true,
        message: "Inscripción exitosa",
        enrollment: response
      }
    } catch (err) {
      const errorMessage = "Error al inscribirse en la actividad"
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Función mejorada para desinscribirse de una actividad
  const unenrollFromActivity = useCallback(async (activityId: number, userId: number): Promise<EnrollmentResponse> => {
    setLoading(true)
    setError(null)
    
    try {
      const enrollmentRequest: EnrollmentRequest = {
        activityId,
        userId,
        status: AttendanceStatus.ABSENT,
        createdAt: new Date()
      }

      const response = await unenrollActivity(enrollmentRequest)
      
      // Actualizar la lista de actividades localmente
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId 
            ? { 
                ...activity, 
                participants: activity.participants.filter(id => id !== userId),
                currentParticipants: Math.max(0, activity.currentParticipants - 1)
              }
            : activity
        )
      )

      return {
        success: true,
        message: "Desinscripción exitosa",
        enrollment: response
      }
    } catch (err) {
      const errorMessage = "Error al desinscribirse de la actividad"
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Función para marcar asistencia de un participante
  const markParticipantPresent = useCallback(async (activityId: number, participantId: number, status: AttendanceStatus) => {
    setLoading(true)
    setError(null)
    
    try {
      const attendanceRequest: EnrollmentRequest = {
        activityId,
        userId: participantId,
        status,
        createdAt: new Date()
      }

      await enrollActivity(attendanceRequest) // Reutilizamos la misma función pero con diferente status
      
      // Actualizar el detalle de la actividad si está cargado
      if (selectedActivity && selectedActivity.id === activityId) {
        setSelectedActivity(prev => {
          if (!prev) return prev
          return {
            ...prev,
            participants: prev.participants.map(p => 
              p.id === participantId 
                ? { ...p, status }
                : p
            )
          }
        })
      }

      return {
        success: true,
        message: `Asistencia marcada como ${status}`
      }
    } catch (err) {
      const errorMessage = "Error al marcar la asistencia"
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [selectedActivity])

  // Función para verificar si un usuario está inscrito en una actividad
  const isUserEnrolled = useCallback((activity: ActivityType, userId: number): boolean => {
    return activity.participants.includes(userId)
  }, [])

  // Función para obtener el estado de inscripción de un usuario
  const getUserEnrollmentStatus = useCallback((activity: ActivityType, userId: number): "enrolled" | "not_enrolled" | "full" => {
    if (activity.participants.includes(userId)) {
      return "enrolled"
    }
    if (activity.currentParticipants >= activity.maxParticipants) {
      return "full"
    }
    return "not_enrolled"
  }, [])

  // Limpiar cliente seleccionado
  const clearSelectedActivity = () => setSelectedActivity(null)

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
      weeklySchedule: [false, false, false, false, false, false, false],
    })
  }, [])

  return {
    activities,
    selectedActivity,
    form,
    trainers,
    loading,
    error,
    setForm,
    createActivity,
    editActivity,
    deleteActivityById,
    loadActivities,
    loadActivitiesByWeek,
    loadActivityDetail,
    loadTrainers,
    clearSelectedActivity,
    setActivities, // opcional, por si quieres manipular manualmente
    enrollIntoActivity,
    unenrollFromActivity,
    markParticipantPresent,
    isUserEnrolled,
    getUserEnrollmentStatus,
    resetForm,
  }
}