"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      <DialogContent className="max-w-4xl h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Configurar Cuota Mensual
          </DialogTitle>
          <DialogDescription>
            Establece el valor de la cuota mensual que se cobrará a los clientes.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-4">
            <div className="text-muted-foreground">Cargando configuración...</div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Configuración de Cuota */}
              <Card className="m-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Valor de la Cuota Mensual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                </CardContent>
              </Card>

              {/* Información adicional */}
              <Card className="m-2">
                <CardHeader>
                  <CardTitle className="text-lg">Información Importante</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-lg">
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
                </CardContent>
              </Card>
            </div>

            {/* Botones */}
            <div className="flex gap-3 p-4 border-t border-border">
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
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
