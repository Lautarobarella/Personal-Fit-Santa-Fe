"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useSettingsContext } from "@/contexts/settings-provider"
import { DollarSign } from "lucide-react"
import { useEffect, useState } from "react"

interface MonthlyFeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MonthlyFeeDialog({ open, onOpenChange }: MonthlyFeeDialogProps) {
  const { toast } = useToast()
  const { monthlyFee, updateMonthlyFeeValue, loading } = useSettingsContext()
  const [monthlyFeeInput, setMonthlyFeeInput] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  // Sincronizar el valor del input con el hook de configuraciones
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
        toast({
          title: "Éxito",
          description: result.message,
        })
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating monthly fee:', error)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Configurar Cuota Mensual
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyFee">Valor de la cuota ($)</Label>
            <Input
              id="monthlyFee"
              type="number"
              placeholder="Ingresa el valor de la cuota"
              min="0"
              step="0.01"
              value={monthlyFeeInput}
              onChange={(e) => setMonthlyFeeInput(e.target.value)}
              disabled={loading || isSaving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || isSaving || !monthlyFeeInput.trim()}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
