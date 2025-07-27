import { useState, useCallback } from "react"
import type { ActivityDetailInfo, ActivityFormType, ActivityType } from "@/lib/types"
import { enrollActivity, fetchActivities, fetchActivityDetail, newActivity } from "@/api/activities/activitiesApi"

export function useActivities() {
  const [activities, setActivities] = useState<ActivityType[]>([])
  const [selectedActivity, setSelectedActivity] = useState<ActivityDetailInfo | null>(null)
  const [form, setForm] = useState<ActivityFormType>({
    name: "",
    description: "",
    location: "",
    category: "",
    trainerName: "",
    date: "",
    duration: "",
    maxParticipants: "",
    })
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

  // Cargar detalle de un cliente
  const loadActivityDetail = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const detail = await fetchActivityDetail(id)
      setSelectedActivity(detail)
      console.log("Detalle de la actividad cargada:", detail)
    } catch (err) {
      setError("Error al cargar el detalle de la actividad")
    } finally {
      setLoading(false)
    }
  }, [])

  const createActivity = useCallback(async (clientData: ActivityFormType) => {
    setLoading(true)
    setError(null)
    try {
      newActivity(clientData) 
      console.log("Activitye creado:", clientData)
    } catch (err) {
      setError("Error al crear el cliente")
    }
    setLoading(false)
  }, [])

  const enrollIntoActivity = useCallback((activityId: number) => {
    setLoading(true)
    try{
      enrollActivity(activityId)
    }
    catch (err) {
      setError("Error al inscribirse en la actividad")
    } finally {
      setLoading(false)
    }

  }, [])

  // Limpiar cliente seleccionado
  const clearSelectedActivity = () => setSelectedActivity(null)

  return {
    activities,
    selectedActivity,
    form,
    loading,
    error,
    setForm,
    createActivity,
    loadActivities,
    loadActivityDetail,
    clearSelectedActivity,
    setActivities, // opcional, por si quieres manipular manualmente
    enrollIntoActivity,
  }
}