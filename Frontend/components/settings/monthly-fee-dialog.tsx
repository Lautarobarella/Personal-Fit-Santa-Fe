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
import { DollarSign, Save } from "lucide-react"
import { useMonthlyFeeDialog } from "@/hooks/settings/use-monthly-fee-dialog"

interface MonthlyFeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MonthlyFeeDialog({ open, onOpenChange }: MonthlyFeeDialogProps) {
  const {
    monthlyFeeInput,
    setMonthlyFeeInput,
    isSaving,
    loading,
    handleSave,
    handleCancel,
  } = useMonthlyFeeDialog(open, onOpenChange)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lg:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="size-4 text-primary" />
            </span>
            Configurar Cuota Mensual
          </DialogTitle>
          <DialogDescription>
            Establece el valor de la cuota mensual que se cobrará a los clientes.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <DialogBody>
            <div className="py-4 text-center text-muted-foreground">Cargando configuración…</div>
          </DialogBody>
        ) : (
          <>
            <DialogBody className="space-y-4">
              {/* Configuración de Cuota */}
              <div className="rounded-xl border p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <span className="h-5 w-1 rounded-full bg-primary" />
                  Valor de la Cuota Mensual
                </h4>
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
                  <p className="text-xs text-muted-foreground">
                    Este será el monto base que se cobrará mensualmente a cada cliente.
                  </p>
                </div>
              </div>

              {/* Información adicional */}
              <div className="rounded-xl border p-4">
                <h4 className="mb-2 text-sm font-semibold">Información Importante</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Consideraciones:</strong>
                  <br />
                  • El valor se aplicará a todos los nuevos pagos generados.
                  <br />
                  • Los pagos pendientes mantendrán su valor original.
                  <br />
                  • Se recomienda notificar a los clientes sobre cambios en la cuota.
                </p>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || isSaving || !monthlyFeeInput.trim()}
                className="flex-1"
              >
                <Save className="size-4 mr-2" />
                {isSaving ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
