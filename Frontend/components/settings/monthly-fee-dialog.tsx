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
        <DialogHeader className="pr-12">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="size-5 shrink-0 text-primary" />
            <span className="min-w-0">Configurar Cuota Mensual</span>
          </DialogTitle>
          <DialogDescription>
            Establece el valor de la cuota mensual que se cobrará a los clientes.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <DialogBody>
            <div className="py-8 text-center text-sm text-muted-foreground">Cargando configuración…</div>
          </DialogBody>
        ) : (
          <>
            <DialogBody className="space-y-3">
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
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
                  Información Importante
                </h4>
                <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  <strong className="text-foreground">Consideraciones:</strong>
                  <br />
                  • El valor se aplicará a todos los nuevos pagos generados.
                  <br />
                  • Los pagos pendientes mantendrán su valor original.
                  <br />
                  • Se recomienda notificar a los clientes sobre cambios en la cuota.
                </p>
              </div>
            </DialogBody>

            <DialogFooter className="flex-row items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="min-w-0 flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || isSaving || !monthlyFeeInput.trim()}
                className="min-w-0 flex-1"
              >
                <Save className="mr-2 size-4 shrink-0 max-sm:hidden" />
                {isSaving ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
