"use client"

import { esShortDateYearFormatter, esTimeFormatter } from "@/lib/formatters"
import { useToast } from "@/hooks/use-toast"
import { ActivityType } from "@/lib/types"
import { useState } from "react"

export function useEnrollActivityDialog(
  activity: ActivityType,
  isEnrolled: boolean,
  onToggleEnrollment: (activity: ActivityType) => Promise<void>,
  onOpenChange: (open: boolean) => void,
) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const formatDate = (date: Date) => {
    return esShortDateYearFormatter.format(new Date(date))
  }

  const formatTime = (date: Date) => {
    return esTimeFormatter.format(new Date(date))
  }

  const handleAction = async () => {
    setIsLoading(true)

    try {
      await onToggleEnrollment(activity)
      toast({
        title: isEnrolled ? "Desinscripción Exitosa" : "Inscripción Exitosa",
        description: isEnrolled
          ? `Te has desinscripto de "${activity.name}".`
          : `Te has inscripto a "${activity.name}".`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: isEnrolled
          ? "No se pudo desinscribir de la actividad, intente nuevamente."
          : "No se pudo inscribir a la actividad, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    formatDate,
    formatTime,
    handleAction,
  }
}
