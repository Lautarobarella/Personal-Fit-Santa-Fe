"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, Save } from "lucide-react"
import { usePaymentGracePeriodDialog } from "@/hooks/settings/use-payment-grace-period-dialog"

interface PaymentGracePeriodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PaymentGracePeriodDialog({ open, onOpenChange }: PaymentGracePeriodDialogProps) {
  const {
    days,
    setDays,
    paymentGracePeriodDays,
    isUpdatingPaymentGracePeriod,
    handleSubmit,
    handleOpenChange,
  } = usePaymentGracePeriodDialog(open, onOpenChange)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Período de Gracia de Pago
          </DialogTitle>
          <DialogDescription>
            Configura el período de gracia para usuarios con pagos pendientes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Configuración del Período de Gracia */}
            <Card className="m-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Período de Gracia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <form onSubmit={handleSubmit}>
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
                    <p className="text-xs text-muted-foreground">
                      Número de días que un usuario con pago pendiente puede inscribirse a actividades. 
                      Después de este tiempo, no podrá inscribirse hasta que su pago sea verificado.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Valor actual:</strong> {paymentGracePeriodDays} {paymentGracePeriodDays === 1 ? 'día' : 'días'}
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Ejemplo explicativo */}
            <Card className="m-2">
              <CardHeader>
                <CardTitle className="text-lg">Ejemplo de Funcionamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Con período de gracia de 7 días:</strong>
                    <br />
                    • Usuario realiza pago el día 1 de enero
                    <br />
                    • Pago vence el día 31 de enero
                    <br />
                    • El usuario puede inscribirse a actividades hasta el día 7 de febrero
                    <br />
                    • Después del día 7, debe renovar su pago para inscribirse
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botones */}
          <div className="flex gap-3 p-4 border-t border-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isUpdatingPaymentGracePeriod}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isUpdatingPaymentGracePeriod} 
              onClick={handleSubmit}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isUpdatingPaymentGracePeriod ? "Actualizando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
