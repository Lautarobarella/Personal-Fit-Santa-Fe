"use client"

import { useToast } from "@/hooks/use-toast"
import { useSettingsContext } from "@/contexts/settings-provider"
import { useState, useEffect } from "react"

export function useMaxActivitiesDialog(open: boolean, onOpenChange: (open: boolean) => void) {
  const { toast } = useToast()
  const {
    maxActivitiesPerDay,
    updateMaxActivitiesPerDayValue,
    loading,
    isUpdatingMaxActivitiesPerDay,
  } = useSettingsContext()

  const [inputValue, setInputValue] = useState<string>("1")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && maxActivitiesPerDay) {
      setInputValue(maxActivitiesPerDay.toString())
    }
  }, [open, maxActivitiesPerDay])

  const handleSave = async () => {
    try {
      setSaving(true)
      const maxActivities = parseInt(inputValue)

      if (isNaN(maxActivities) || maxActivities <= 0) {
        toast({
          title: "Error",
          description: "El máximo de actividades debe ser mayor a 0",
          variant: "destructive",
        })
        return
      }

      const result = await updateMaxActivitiesPerDayValue(maxActivities)

      if (result.success) {
        toast({ title: "Éxito", description: result.message, variant: "default" })
        onOpenChange(false)
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el máximo de actividades por día",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setInputValue(maxActivitiesPerDay?.toString() || "1")
    onOpenChange(false)
  }

  return {
    inputValue,
    setInputValue,
    saving,
    loading,
    isUpdatingMaxActivitiesPerDay,
    handleSave,
    handleCancel,
  }
}
