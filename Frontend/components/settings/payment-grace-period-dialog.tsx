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
        <DialogHeader className="pr-12">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="size-5 shrink-0 text-primary" />
            <span className="min-w-0">Período de Gracia de Pago</span>
          </DialogTitle>
          <DialogDescription>
            Configura el período de gracia para usuarios con pagos pendientes.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
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
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Valor actual</p>
                  <p className="text-xl font-semibold">
                    {paymentGracePeriodDays} {paymentGracePeriodDays === 1 ? 'día' : 'días'}
                  </p>
                </div>
              </div>
            </form>
          </div>

          {/* Ejemplo explicativo */}
          <div className="rounded-xl border p-4">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
              Ejemplo de Funcionamiento
            </h4>
            <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <strong className="text-foreground">Con período de gracia de 7 días:</strong>
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

        <DialogFooter className="flex-row items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isUpdatingPaymentGracePeriod}
            className="min-w-0 flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isUpdatingPaymentGracePeriod}
            onClick={handleSubmit}
            className="min-w-0 flex-1"
          >
            <Save className="mr-2 size-4 shrink-0 max-sm:hidden" />
            {isUpdatingPaymentGracePeriod ? "Actualizando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
