"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSettingsContext } from "@/contexts/settings-provider"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface PaymentGracePeriodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PaymentGracePeriodDialog({ open, onOpenChange }: PaymentGracePeriodDialogProps) {
  const { paymentGracePeriodDays, updatePaymentGracePeriodValue, isUpdatingPaymentGracePeriod } = useSettingsContext()
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
        toast({
          title: "Éxito",
          description: result.message,
          variant: "default",
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
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el período de gracia",
        variant: "destructive",
      })
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setDays(paymentGracePeriodDays.toString())
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Período de Gracia de Pago</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="days">Días de gracia para usuarios con pago pendiente</Label>
            <Input
              id="days"
              type="number"
              min="0"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="Ejemplo: 10"
              required
            />
            <p className="text-sm text-muted-foreground">
              Número de días que un usuario con pago pendiente puede inscribirse a actividades. 
              Después de este tiempo, no podrá inscribirse hasta que su pago sea verificado.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Valor actual:</strong> {paymentGracePeriodDays} {paymentGracePeriodDays === 1 ? 'día' : 'días'}
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isUpdatingPaymentGracePeriod} className="flex-1">
              {isUpdatingPaymentGracePeriod ? "Actualizando..." : "Actualizar"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isUpdatingPaymentGracePeriod}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
