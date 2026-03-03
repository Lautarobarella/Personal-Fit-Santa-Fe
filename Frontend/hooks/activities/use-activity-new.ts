"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useActivityContext } from "@/contexts/activity-provider"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"

export function useActivityNew() {
  const { user } = useRequireAuth()
  const { toast } = useToast()
  const router = useRouter()

  const {
    form,
    setForm,
    trainers,
    loading,
    error,
    createActivity,
    loadTrainers,
    resetForm,
  } = useActivityContext()

  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Verificar permisos - solo ADMIN puede acceder
  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para crear actividades",
        variant: "destructive",
      })
      router.push("/activities")
      return
    }

    if (!isInitialized) {
      loadTrainers()
      setIsInitialized(true)
    }
  }, [user, router, toast, loadTrainers, isInitialized])

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

    // Validar que la fecha no sea pasada
    const selectedDate = new Date(form.date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      toast({
        title: "Error",
        description: "No puedes crear actividades en fechas pasadas",
        variant: "destructive",
      })
      return
    }

    // Validar que la hora no sea pasada para el día de hoy
    if (selectedDate.getTime() === today.getTime()) {
      const [hours, minutes] = form.time.split(':').map(Number)
      const now = new Date()
      const selectedTime = new Date()
      selectedTime.setHours(hours, minutes, 0, 0)

      if (selectedTime <= now) {
        toast({
          title: "Error",
          description: "No puedes crear actividades con horas que ya pasaron",
          variant: "destructive",
        })
        return
      }
    }

    setIsLoading(true)

    try {
      await createActivity(form)
      toast({
        title: "Actividad creada",
        description: "La actividad ha sido creada exitosamente",
      })
      router.push("/activities")
    } catch {
      toast({
        title: "Error",
        description: "No se pudo crear la actividad. Intenta nuevamente.",
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
    isInitialized,
    handleInputChange,
    handleSubmit,
  }
}
