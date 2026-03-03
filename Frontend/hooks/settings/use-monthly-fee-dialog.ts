"use client"

import { useToast } from "@/hooks/use-toast"
import { useSettingsContext } from "@/contexts/settings-provider"
import { useEffect, useState } from "react"

export function useMonthlyFeeDialog(open: boolean, onOpenChange: (open: boolean) => void) {
  const { toast } = useToast()
  const { monthlyFee, updateMonthlyFeeValue, loading } = useSettingsContext()
  const [monthlyFeeInput, setMonthlyFeeInput] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open && monthlyFee > 0) {
      setMonthlyFeeInput(monthlyFee.toString())
    }
  }, [open, monthlyFee])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const amount = parseFloat(monthlyFeeInput)
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "El valor debe ser un número positivo",
          variant: "destructive",
        })
        return
      }

      const result = await updateMonthlyFeeValue(amount)

      if (result.success) {
        toast({ title: "Éxito", description: result.message })
        onOpenChange(false)
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      console.error("Error updating monthly fee:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el valor de la cuota",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setMonthlyFeeInput(monthlyFee.toString())
    onOpenChange(false)
  }

  return {
    monthlyFeeInput,
    setMonthlyFeeInput,
    isSaving,
    loading,
    handleSave,
    handleCancel,
  }
}
