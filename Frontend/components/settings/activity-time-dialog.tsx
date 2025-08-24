"use client"

import { useState, useEffect } from "react"
import { Clock, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSettings } from "@/hooks/settings/use-settings"
import { toast } from "sonner"

interface ActivityTimesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ActivityTimesDialog({ open, onOpenChange }: ActivityTimesDialogProps) {
    const {
        registrationTime,
        unregistrationTime,
        loading,
        updateRegistrationTime,
        updateUnregistrationTime
    } = useSettings()

    const [regTime, setRegTime] = useState<string>("")
    const [unregTime, setUnregTime] = useState<string>("")
    const [saving, setSaving] = useState(false)

    // Inicializar valores cuando se carguen o cuando se abra el dialog
    useEffect(() => {
        if (!loading && open) {
            setRegTime(registrationTime.toString())
            setUnregTime(unregistrationTime.toString())
        }
    }, [loading, registrationTime, unregistrationTime, open])

    const handleSave = async () => {
        try {
            setSaving(true)

            const regHours = parseInt(regTime)
            const unregHours = parseInt(unregTime)

            if (isNaN(regHours) || regHours < 0 || regHours > 720) {
                toast.error("El tiempo de inscripción debe ser entre 0 y 720 horas")
                return
            }

            if (isNaN(unregHours) || unregHours < 0 || unregHours > 6) {
                toast.error("El tiempo de desinscripción debe ser entre 0 y 6 horas")
                return
            }

            updateRegistrationTime(regHours),
                updateUnregistrationTime(unregHours)

            toast.success("Configuración guardada correctamente")
            onOpenChange(false)
        } catch (error) {
            toast.error("Error al guardar la configuración")
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        // Resetear valores a los originales
        setRegTime(registrationTime.toString())
        setUnregTime(unregistrationTime.toString())
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Tiempos de Actividades
                    </DialogTitle>
                    <DialogDescription>
                        Configura los tiempos mínimos de anticipación para inscripciones y desinscripciones.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="text-center py-4">
                        <div className="text-muted-foreground">Cargando configuración...</div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Tiempo de Inscripción */}
                        <div className="space-y-2">
                            <Label htmlFor="registration-time">
                                Tiempo de Inscripción (horas)
                            </Label>
                            <Input
                                id="registration-time"
                                type="number"
                                min="0"
                                max="168"
                                value={regTime}
                                onChange={(e) => setRegTime(e.target.value)}
                                placeholder="24"
                            />
                            <p className="text-xs text-muted-foreground">
                                Tiempo mínimo antes del inicio para inscribirse
                            </p>
                        </div>

                        {/* Tiempo de Desinscripción */}
                        <div className="space-y-2">
                            <Label htmlFor="unregistration-time">
                                Tiempo de Desinscripción (horas)
                            </Label>
                            <Input
                                id="unregistration-time"
                                type="number"
                                min="0"
                                max="168"
                                value={unregTime}
                                onChange={(e) => setUnregTime(e.target.value)}
                                placeholder="3"
                            />
                            <p className="text-xs text-muted-foreground">
                                Tiempo mínimo antes del inicio para desinscribirse
                            </p>
                        </div>

                        {/* Ejemplo explicativo */}
                        <div className="bg-muted p-3 rounded-lg">
                            <h4 className="font-medium text-sm mb-1">Ejemplo:</h4>
                            <p className="text-xs text-muted-foreground">
                                Actividad a las 9:00 AM. Con 24h de inscripción: disponible desde las 9:00 AM del día anterior.
                                Con 3h de desinscripción: hasta las 6:00 AM del mismo día.
                            </p>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                disabled={saving}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}