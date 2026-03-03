"use client"

import { useSettingsContext } from "@/contexts/settings-provider"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export function usePaymentGracePeriodDialog(open: boolean, onOpenChange: (open: boolean) => void) {
  const { paymentGracePeriodDays, updatePaymentGracePeriodValue, isUpdatingPaymentGracePeriod } =
    useSettingsContext()
  const { toast } = useToast()
  const [days, setDays] = useState(paymentGracePeriodDays.toString())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const daysNumber = parseInt(days)
    if (isNaN(daysNumber) || daysNumber < 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un número válido de días (0 o mayor)",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await updatePaymentGracePeriodValue(daysNumber)

      if (result.success) {
        toast({ title: "Éxito", description: result.message, variant: "default" })
        onOpenChange(false)
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el período de gracia",
        variant: "destructive",
      })
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setDays(paymentGracePeriodDays.toString())
    }
    onOpenChange(newOpen)
  }

  return {
    days,
    setDays,
    paymentGracePeriodDays,
    isUpdatingPaymentGracePeriod,
    handleSubmit,
    handleOpenChange,
  }
}
