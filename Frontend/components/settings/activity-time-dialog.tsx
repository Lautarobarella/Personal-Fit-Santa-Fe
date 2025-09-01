"use client"

import { useState, useEffect } from "react"
import { Clock, Save } from "lucide-react"
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
import { useSettingsContext } from "@/contexts/settings-provider"
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
        updateRegistrationTimeValue,
        updateUnregistrationTimeValue
    } = useSettingsContext()

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

            const regResult = await updateRegistrationTimeValue(regHours)
            const unregResult = await updateUnregistrationTimeValue(unregHours)

            if (regResult.success && unregResult.success) {
                toast.success("Configuración guardada correctamente")
                onOpenChange(false)
            } else {
                toast.error("Error al guardar la configuración")
            }
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
            <DialogContent className="max-w-4xl h-[90vh] overflow-hidden">
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
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto space-y-4">
                            {/* Tiempo de Inscripción */}
                            <Card className="m-2">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        Tiempo de Inscripción
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="registration-time">
                                            Tiempo de Inscripción (horas)
                                        </Label>
                                        <Input
                                            id="registration-time"
                                            type="number"
                                            min="0"
                                            max="720"
                                            value={regTime}
                                            onChange={(e) => setRegTime(e.target.value)}
                                            placeholder="24"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Tiempo mínimo antes del inicio para inscribirse en una actividad.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tiempo de Desinscripción */}
                            <Card className="m-2">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        Tiempo de Desinscripción
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="unregistration-time">
                                            Tiempo de Desinscripción (horas)
                                        </Label>
                                        <Input
                                            id="unregistration-time"
                                            type="number"
                                            min="0"
                                            max="6"
                                            value={unregTime}
                                            onChange={(e) => setUnregTime(e.target.value)}
                                            placeholder="3"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Tiempo mínimo antes del inicio para desinscribirse de una actividad.
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
                                            <strong>Actividad programada a las 9:00 AM:</strong>
                                            <br />
                                            • Con 24h de inscripción: disponible para inscripción desde las 9:00 AM del día anterior.
                                            <br />
                                            • Con 3h de desinscripción: posible desinscribirse hasta las 6:00 AM del mismo día.
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