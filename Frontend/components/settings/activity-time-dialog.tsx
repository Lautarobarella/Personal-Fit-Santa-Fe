"use client"

import { Clock, Save } from "lucide-react"
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
import { useActivityTimeDialog } from "@/hooks/settings/use-activity-time-dialog"

interface ActivityTimesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ActivityTimesDialog({ open, onOpenChange }: ActivityTimesDialogProps) {
    const {
        regTime,
        setRegTime,
        unregTime,
        setUnregTime,
        saving,
        loading,
        handleSave,
        handleCancel,
    } = useActivityTimeDialog(open, onOpenChange)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="lg:max-w-lg">
                <DialogHeader className="pr-12">
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="size-5 shrink-0 text-primary" />
                        <span className="min-w-0">Tiempos de Actividades</span>
                    </DialogTitle>
                    <DialogDescription>
                        Configura los tiempos mínimos de anticipación para inscripciones y desinscripciones.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <DialogBody>
                        <div className="py-8 text-center text-sm text-muted-foreground">Cargando configuración…</div>
                    </DialogBody>
                ) : (
                    <>
                        <DialogBody className="space-y-3">
                            {/* Tiempo de Inscripción */}
                            <div className="rounded-xl border p-4">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                    <span className="h-5 w-1 rounded-full bg-primary" />
                                    Tiempo de Inscripción
                                </h4>
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
                            </div>

                            {/* Tiempo de Desinscripción */}
                            <div className="rounded-xl border p-4">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                    <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
                                    Tiempo de Desinscripción
                                </h4>
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
                            </div>

                            {/* Ejemplo explicativo */}
                            <div className="rounded-xl border p-4">
                                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <span className="h-5 w-1 rounded-full bg-primary" />
                                    Ejemplo de Funcionamiento
                                </h4>
                                <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                                    <strong className="text-foreground">Actividad programada a las 9:00 AM:</strong>
                                    <br />
                                    • Con 24h de inscripción: disponible para inscripción desde las 9:00 AM del día anterior.
                                    <br />
                                    • Con 3h de desinscripción: posible desinscribirse hasta las 6:00 AM del mismo día.
                                </p>
                            </div>
                        </DialogBody>

                        <DialogFooter className="flex-row items-center gap-2">
                            <Button
                                variant="ghost"
                                onClick={handleCancel}
                                disabled={saving}
                                className="min-w-0 flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="min-w-0 flex-1"
                            >
                                <Save className="mr-2 size-4 shrink-0 max-sm:hidden" />
                                {saving ? "Guardando…" : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
