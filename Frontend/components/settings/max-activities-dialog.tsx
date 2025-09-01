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
import { useToast } from "@/hooks/use-toast"
import { useSettingsContext } from "@/contexts/settings-provider"
import { useState, useEffect } from "react"
import { Users, Save } from "lucide-react"

interface MaxActivitiesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MaxActivitiesDialog({ open, onOpenChange }: MaxActivitiesDialogProps) {
  const { toast } = useToast()
  const { 
    maxActivitiesPerDay, 
    updateMaxActivitiesPerDayValue, 
    loading,
    isUpdatingMaxActivitiesPerDay 
  } = useSettingsContext()
  
  const [inputValue, setInputValue] = useState<string>("1")
  const [saving, setSaving] = useState(false)

  // Sincronizar con el valor del contexto cuando se abre el diálogo
  useEffect(() => {
    if (open && maxActivitiesPerDay) {
      setInputValue(maxActivitiesPerDay.toString())
    }
  }, [open, maxActivitiesPerDay])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const maxActivities = parseInt(inputValue)

      if (isNaN(maxActivities) || maxActivities <= 0) {
        toast({
          title: "Error",
          description: "El máximo de actividades debe ser mayor a 0",
          variant: "destructive"
        })
        return
      }

      const result = await updateMaxActivitiesPerDayValue(maxActivities)
      
      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
          variant: "default"
        })
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el máximo de actividades por día",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Resetear valor al original
    setInputValue(maxActivitiesPerDay?.toString() || "1")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Máximo de Actividades por Día
          </DialogTitle>
          <DialogDescription>
            Establece el número máximo de actividades a las que un cliente puede inscribirse por día.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-4">
            <div className="text-muted-foreground">Cargando configuración...</div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Configuración de Máximo de Actividades */}
              <Card className="m-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Límite de Inscripciones Diarias
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                      <strong>Con límite de {parseInt(inputValue) || 1} actividad{(parseInt(inputValue) || 1) !== 1 ? 'es' : ''} por día:</strong>
                      <br />
                      • Un cliente puede inscribirse a máximo {parseInt(inputValue) || 1} actividad{(parseInt(inputValue) || 1) !== 1 ? 'es' : ''} en una misma fecha.
                      <br />
                      • Si intenta inscribirse a más actividades en el mismo día, el sistema lo impedirá.
                      <br />
                      • Esta limitación ayuda a distribuir mejor las inscripciones y evitar sobrecargas.
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
                <Save className="h-4 w-4 mr-2" />
                {saving || isUpdatingMaxActivitiesPerDay ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
