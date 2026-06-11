"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
      <DialogContent className="lg:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="size-4 text-primary" />
            </span>
            Período de Gracia de Pago
          </DialogTitle>
          <DialogDescription>
            Configura el período de gracia para usuarios con pagos pendientes.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Configuración del Período de Gracia */}
          <div className="rounded-xl border p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <span className="h-5 w-1 rounded-full bg-primary" />
              Período de Gracia
            </h4>
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
          </div>

          {/* Ejemplo explicativo */}
          <div className="rounded-xl border p-4">
            <h4 className="mb-2 text-sm font-semibold">Ejemplo de Funcionamiento</h4>
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
        </DialogBody>

        <DialogFooter>
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
            <Save className="size-4 mr-2" />
            {isUpdatingPaymentGracePeriod ? "Actualizando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
