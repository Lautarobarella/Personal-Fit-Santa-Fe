"use client"

import { useSettingsContext } from "@/contexts/settings-provider"
import { toast } from "sonner"
import { useState, useEffect } from "react"

export function useActivityTimeDialog(open: boolean, onOpenChange: (open: boolean) => void) {
  const {
    registrationTime,
    unregistrationTime,
    loading,
    updateRegistrationTimeValue,
    updateUnregistrationTimeValue,
  } = useSettingsContext()

  const [regTime, setRegTime] = useState<string>("")
  const [unregTime, setUnregTime] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && open) {
      setRegTime(registrationTime.toString())
      setUnregTime(unregistrationTime.toString())
    }
  }, [loading, registrationTime, unregistrationTime, open])

  const handleSave = async () => {
    try {
      setSaving(true)
      const regHours = parseInt(regTime)
      const unregHours = parseInt(unregTime)

      if (isNaN(regHours) || regHours < 0 || regHours > 720) {
        toast.error("El tiempo de inscripción debe ser entre 0 y 720 horas")
        return
      }

      if (isNaN(unregHours) || unregHours < 0 || unregHours > 6) {
        toast.error("El tiempo de desinscripción debe ser entre 0 y 6 horas")
        return
      }

      const regResult = await updateRegistrationTimeValue(regHours)
      const unregResult = await updateUnregistrationTimeValue(unregHours)

      if (regResult.success && unregResult.success) {
        toast.success("Configuración guardada correctamente")
        onOpenChange(false)
      } else {
        toast.error("Error al guardar la configuración")
      }
    } catch (error) {
      toast.error("Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setRegTime(registrationTime.toString())
    setUnregTime(unregistrationTime.toString())
    onOpenChange(false)
  }

  return {
    regTime,
    setRegTime,
    unregTime,
    setUnregTime,
    saving,
    loading,
    handleSave,
    handleCancel,
  }
}
