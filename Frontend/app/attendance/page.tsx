"use client"

import { useAttendancePage } from "@/hooks/attendance/use-attendance-page"
import { UserRole, AttendanceStatus } from "@/types"
import { MobileHeader } from "@/components/ui/mobile-header"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { CheckCircle, XCircle, Users, Loader2 } from "lucide-react"

export default function AttendancePage() {
    const {
        user,
        activities,
        selectedActivityId,
        setSelectedActivityId,
        participants,
        loadingActivities,
        loadingParticipants,
        updating,
        todayFormatted,
        handleStatusUpdate,
    } = useAttendancePage()

    if (!user || user.role !== UserRole.TRAINER) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-muted-foreground">Acceso restringido a entrenadores.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-safe-bottom">
            <MobileHeader title="Control de Asistencia" />

            <div className="container-centered py-6 space-y-6">

                {/* Selector de clase */}
                <section>
                    <div className="mb-3 flex items-center gap-2">
                        <span className="h-5 w-1 rounded-full bg-primary" />
                        <h3 className="text-base font-semibold">Seleccionar Clase</h3>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="mb-3 text-sm text-muted-foreground">
                            Clases programadas para hoy ({todayFormatted})
                        </p>
                        {loadingActivities ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="size-6 animate-spin text-primary" />
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                                No tienes clases asignadas para hoy.
                            </div>
                        ) : (
                            <Select onValueChange={setSelectedActivityId} value={selectedActivityId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecciona una clase…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activities.map(activity => (
                                        <SelectItem key={activity.id} value={activity.id.toString()}>
                                            {format(new Date(activity.date), "HH:mm")} - {activity.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </section>

                {/* Lista de alumnos */}
                {selectedActivityId && (
                    <section>
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
                                <h3 className="text-base font-semibold">Lista de Alumnos</h3>
                            </div>
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Users className="size-4" />
                                {participants.length} inscriptos
                            </span>
                        </div>

                        {loadingParticipants ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="size-8 animate-spin text-primary" />
                            </div>
                        ) : participants.length === 0 ? (
                            <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                                <Users className="size-12 mx-auto mb-2 opacity-20" />
                                <p>No hay alumnos inscriptos en esta clase.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {participants.map((participant) => (
                                    <div
                                        key={participant.id}
                                        className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40"
                                    >
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate font-medium text-foreground">
                                                {participant.firstName} {participant.lastName}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {participant.dni ? `DNI: ${participant.dni}` : 'Sin DNI'}
                                            </span>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant={participant.status === AttendanceStatus.PRESENT ? "default" : "outline"}
                                                className={`rounded-full h-8 px-3 ${participant.status === AttendanceStatus.PRESENT ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                                                onClick={() => handleStatusUpdate(participant.id, AttendanceStatus.PRESENT)}
                                                disabled={updating === participant.id}
                                            >
                                                {updating === participant.id && participant.status !== AttendanceStatus.PRESENT ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle className="size-4 mr-1" />}
                                                Presente
                                            </Button>

                                            {/* Optional: Button to mark Late or Absent explicitely if needed, but toggle usually implies Present vs (Absent/Pending) */}
                                            {participant.status === AttendanceStatus.PRESENT && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="size-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleStatusUpdate(participant.id, AttendanceStatus.ABSENT)}
                                                    disabled={updating === participant.id}
                                                >
                                                    <XCircle className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

            </div>
            <BottomNav />
        </div>
    )
}
