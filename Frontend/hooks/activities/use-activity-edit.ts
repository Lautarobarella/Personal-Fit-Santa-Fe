"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useActivityContext } from "@/contexts/activity-provider"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"

export function useActivityEdit(params: Promise<{ id: string }>) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useRequireAuth()

  const {
    form,
    setForm,
    trainers,
    selectedActivity,
    loading,
    error,
    updateActivity,
    loadActivityDetail,
    loadTrainers,
    resetForm,
  } = useActivityContext()

  const [isLoading, setIsLoading] = useState(false)
  const [activityId, setActivityId] = useState<string | null>(null)

  // Obtener el ID del parámetro async
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setActivityId(resolvedParams.id)
    }
    getParams()
  }, [params])

  // Verificar permisos y cargar datos
  useEffect(() => {
    if (user?.role === UserRole.ADMIN && activityId) {
      loadActivityDetail(parseInt(activityId))
      loadTrainers()
    } else if (user?.role !== UserRole.ADMIN) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para editar actividades",
        variant: "destructive",
      })
      router.push("/activities")
      return
    }
  }, [user, activityId, router, toast, loadActivityDetail, loadTrainers])

  // Poblar el formulario cuando se cargan los detalles
  useEffect(() => {
    if (selectedActivity && selectedActivity.id.toString() === activityId) {
      const activityDate = new Date(selectedActivity.date)
      const dateString = activityDate.toISOString().split('T')[0]
      const timeString = activityDate.toTimeString().slice(0, 5)

      setForm({
        id: selectedActivity.id.toString(),
        name: selectedActivity.name,
        description: selectedActivity.description || "",
        location: selectedActivity.location || "",
        trainerId: selectedActivity.trainerId?.toString() || "",
        date: dateString,
        time: timeString,
        duration: selectedActivity.duration.toString(),
        maxParticipants: selectedActivity.maxParticipants.toString(),
        isRecurring: selectedActivity.isRecurring || false,
      })
    }
  }, [selectedActivity, activityId, setForm])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      resetForm()
    }
  }, [resetForm])

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim() || !form.trainerId || !form.date || !form.time || !form.duration || !form.maxParticipants) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    if (parseInt(form.duration) <= 0 || parseInt(form.maxParticipants) <= 0) {
      toast({
        title: "Error",
        description: "La duración y cantidad máxima de participantes deben ser mayores a 0",
        variant: "destructive",
      })
      return
    }

    if (!activityId) {
      toast({
        title: "Error",
        description: "ID de actividad no encontrado",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { id, ...activityData } = form
      await updateActivity(parseInt(activityId), activityData)
      toast({
        title: "Actividad actualizada",
        description: "La actividad ha sido actualizada exitosamente",
      })
      router.push("/activities")
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar la actividad. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    user,
    router,
    form,
    trainers,
    isLoading,
    handleInputChange,
    handleSubmit,
  }
}
