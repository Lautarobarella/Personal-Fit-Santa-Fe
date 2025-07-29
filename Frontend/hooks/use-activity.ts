import { useState, useCallback } from "react"
import type { ActivityDetailInfo, ActivityFormType, ActivityType, Attendance, UserType } from "@/lib/types"
import { 
  editActivityBack, 
  enrollActivity, 
  fetchActivities, 
  fetchActivitiesByDate, 
  fetchActivitiesByDateMock, 
  fetchActivitiesMock, 
  fetchActivityDetail, 
  fetchActivityDetailMock, 
  fetchTrainers, 
  newActivity, 
  unenrollActivity } from "@/api/activities/activitiesApi"

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
      console.log("Actividades cargadas:", data)
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
      // const data = await fetchActivitiesByDate(date)
      const data = await (await fetchActivitiesByDateMock(date))
      // Evitar duplicados por ID
      setActivities((prev) => {
        const existingIds = new Set(prev.map((a) => a.id))
        const newActivities = data.filter((a: ActivityType) => !existingIds.has(a.id))
        return [...prev, ...newActivities]
      })

      console.log("Actividades de la semana cargadas:", data)
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
      console.log("Entrenadores cargados:", data)
    } catch (err) {
      setError("Error al cargar las actividades")
    }
  }, [])

  // Cargar detalle de un cliente
  const loadActivityDetail = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      // const detail = await fetchActivityDetail(id)
      const detail = await fetchActivityDetailMock(id)
      setSelectedActivity(detail)
      console.log("Detalle de la actividad cargada:", detail)
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
      newActivity(activity) 
    } catch (err) {
      setError("Error al crear la actividad")
    }
    setLoading(false)
  }, [])

  const editActivity = useCallback(async (activity: ActivityFormType) => {
    setLoading(true)
    setError(null)
    try {
      editActivityBack(activity) 
    } catch (err) {
      setError("Error al crear la actividad")
    }
    setLoading(false)
  }, [])

  const enrollIntoActivity = useCallback(
    (activityId: number, user: number) => {
      setLoading(true)
      try {
        const attendance: Attendance = {
          activityId: activityId,
          userId: user,
          createdAt: new Date(),
          status: "pending", // o "present" según tu lógica
        }

        enrollActivity(attendance)
      } catch (err) {
        setError("Error al inscribirse en la actividad")
      } finally {
        setLoading(false)
      }
    },
    [] // Dependencia necesaria para usar user.id
  )

  const unenrollFromActivity = useCallback((activityId: number, user: number) => {
    setLoading(true)
      try {
        const attendance: Attendance = {
          activityId: activityId,
          userId: user,
          createdAt: new Date(),
          status: "pending", // o "present" según tu lógica
      }
      unenrollActivity(attendance)
    }
    catch (err) {
      setError("Error al inscribirse en la actividad")
    } finally {
      setLoading(false)
    }

  }, [])

  const markParticipantPresent = useCallback((activity: ActivityDetailInfo, participantId: number) =>{

  },[])

  // Limpiar cliente seleccionado
  const clearSelectedActivity = () => setSelectedActivity(null)

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
    loadActivities,
    loadActivitiesByWeek,
    loadActivityDetail,
    loadTrainers,
    clearSelectedActivity,
    setActivities, // opcional, por si quieres manipular manualmente
    enrollIntoActivity,
    unenrollFromActivity,
    markParticipantPresent,
  }
}