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
import { Users, Save } from "lucide-react"
import { useMaxActivitiesDialog } from "@/hooks/settings/use-max-activities-dialog"

interface MaxActivitiesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MaxActivitiesDialog({ open, onOpenChange }: MaxActivitiesDialogProps) {
  const {
    inputValue,
    setInputValue,
    saving,
    loading,
    isUpdatingMaxActivitiesPerDay,
    handleSave,
    handleCancel,
  } = useMaxActivitiesDialog(open, onOpenChange)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lg:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-4 text-primary" />
            </span>
            Máximo de Actividades por Día
          </DialogTitle>
          <DialogDescription>
            Establece el número máximo de actividades a las que un cliente puede inscribirse por día.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <DialogBody>
            <div className="py-4 text-center text-muted-foreground">Cargando configuración…</div>
          </DialogBody>
        ) : (
          <>
            <DialogBody className="space-y-4">
              {/* Configuración de Máximo de Actividades */}
              <div className="rounded-xl border p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <span className="h-5 w-1 rounded-full bg-primary" />
                  Límite de Inscripciones Diarias
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="maxActivities">
                    Máximo de actividades por día
                  </Label>
                  <Input
                    id="maxActivities"
                    type="number"
                    min="1"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Los clientes no podrán inscribirse a más de {parseInt(inputValue) || 1} actividad{(parseInt(inputValue) || 1) !== 1 ? 'es' : ''} en el mismo día.
                  </p>
                </div>
              </div>

              {/* Ejemplo explicativo */}
              <div className="rounded-xl border p-4">
                <h4 className="mb-2 text-sm font-semibold">Ejemplo de Funcionamiento</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Con límite de {parseInt(inputValue) || 1} actividad{(parseInt(inputValue) || 1) !== 1 ? 'es' : ''} por día:</strong>
                  <br />
                  • Un cliente puede inscribirse a máximo {parseInt(inputValue) || 1} actividad{(parseInt(inputValue) || 1) !== 1 ? 'es' : ''} en una misma fecha.
                  <br />
                  • Si intenta inscribirse a más actividades en el mismo día, el sistema lo impedirá.
                  <br />
                  • Esta limitación ayuda a distribuir mejor las inscripciones y evitar sobrecargas.
                </p>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving || isUpdatingMaxActivitiesPerDay}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || isUpdatingMaxActivitiesPerDay}
                className="flex-1"
              >
                <Save className="size-4 mr-2" />
                {saving || isUpdatingMaxActivitiesPerDay ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
