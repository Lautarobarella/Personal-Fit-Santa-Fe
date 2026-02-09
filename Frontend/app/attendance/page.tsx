"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { UserRole, TrainerActivityType, AttendanceType, AttendanceStatus } from "@/lib/types"
import { MobileHeader } from "@/components/ui/mobile-header"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CheckCircle, XCircle, Clock, Users, Calendar as CalendarIcon, Loader2 } from "lucide-react"

export default function AttendancePage() {
    const { user } = useAuth()
    const { toast } = useToast()
    useRequireAuth()

    const [activities, setActivities] = useState<TrainerActivityType[]>([])
    const [selectedActivityId, setSelectedActivityId] = useState<string>("")
    const [participants, setParticipants] = useState<AttendanceType[]>([])
    const [loadingActivities, setLoadingActivities] = useState(false)
    const [loadingParticipants, setLoadingParticipants] = useState(false)
    const [updating, setUpdating] = useState<number | null>(null)

    // Fetch activities for today
    useEffect(() => {
        const fetchActivities = async () => {
            if (!user || user.role !== UserRole.TRAINER) return

            try {
                setLoadingActivities(true)
                const dateStr = format(new Date(), 'yyyy-MM-dd')
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trainer/${user.id}/activities?date=${dateStr}`, {
                    credentials: 'include'
                })

                if (response.ok) {
                    const data = await response.json()
                    setActivities(data)
                    if (data.length > 0) {
                        // Auto-select first activity if available
                        // But maybe let user choose? 
                        // Let's not auto-select to avoid confusion if multiple classes
                    }
                }
            } catch (error) {
                console.error("Error fetching activities:", error)
                toast({
                    title: "Error",
                    description: "No se pudieron cargar las clases asignadas.",
                    variant: "destructive"
                })
            } finally {
                setLoadingActivities(false)
            }
        }

        fetchActivities()
    }, [user, toast])

    // Fetch participants when activity is selected
    useEffect(() => {
        const fetchParticipants = async () => {
            if (!selectedActivityId) return

            try {
                setLoadingParticipants(true)
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/activity/${selectedActivityId}/with-user-info`, {
                    credentials: 'include'
                })

                if (response.ok) {
                    const data = await response.json()
                    setParticipants(data)
                }
            } catch (error) {
                console.error("Error fetching participants:", error)
                toast({
                    title: "Error",
                    description: "No se pudo cargar la lista de alumnos.",
                    variant: "destructive"
                })
            } finally {
                setLoadingParticipants(false)
            }
        }

        fetchParticipants()
    }, [selectedActivityId, toast])

    const handleStatusUpdate = async (attendanceId: number, newStatus: AttendanceStatus) => {
        try {
            setUpdating(attendanceId)
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/${attendanceId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            })

            if (response.ok) {
                // Optimistic update
                setParticipants(prev => prev.map(p =>
                    p.id === attendanceId ? { ...p, status: newStatus } : p
                ))
                toast({
                    title: "Asistencia actualizada",
                    description: `Estado cambiado a ${newStatus === AttendanceStatus.PRESENT ? 'Presente' : 'Ausente'}`,
                    variant: "default"
                })
            } else {
                throw new Error("Failed to update")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo actualizar la asistencia.",
                variant: "destructive"
            })
        } finally {
            setUpdating(null)
        }
    }

    if (!user || user.role !== UserRole.TRAINER) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-muted-foreground">Acceso restringido a entrenadores.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-32">
            <MobileHeader title="Control de Asistencia" />

            <div className="container-centered py-6 space-y-6">

                {/* Activity Selector */}
                <Card className="border-0 shadow-professional">
                    <CardHeader>
                        <CardTitle className="text-lg">Seleccionar Clase</CardTitle>
                        <CardDescription>Clases programadas para hoy ({format(new Date(), "d 'de' MMMM", { locale: es })})</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingActivities ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : activities.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">No tienes clases asignadas para hoy.</p>
                        ) : (
                            <Select onValueChange={setSelectedActivityId} value={selectedActivityId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecciona una clase..." />
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
                    </CardContent>
                </Card>

                {/* Participants List */}
                {selectedActivityId && (
                    <Card className="border-0 shadow-professional">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Lista de Alumnos</CardTitle>
                                <CardDescription>{participants.length} inscritos</CardDescription>
                            </div>
                            <Users className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loadingParticipants ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : participants.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    <p>No hay alumnos inscritos en esta clase.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {participants.map((participant) => (
                                        <div key={participant.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg border border-border/50">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">
                                                    {participant.firstName} {participant.lastName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {participant.dni ? `DNI: ${participant.dni}` : 'Sin DNI'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant={participant.status === AttendanceStatus.PRESENT ? "default" : "outline"}
                                                    className={`rounded-full h-8 px-3 ${participant.status === AttendanceStatus.PRESENT ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                                                    onClick={() => handleStatusUpdate(participant.id, AttendanceStatus.PRESENT)}
                                                    disabled={updating === participant.id}
                                                >
                                                    {updating === participant.id && participant.status !== AttendanceStatus.PRESENT ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                                    Presente
                                                </Button>

                                                {/* Optional: Button to mark Late or Absent explicitely if needed, but toggle usually implies Present vs (Absent/Pending) */}
                                                {participant.status === AttendanceStatus.PRESENT && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleStatusUpdate(participant.id, AttendanceStatus.ABSENT)}
                                                        disabled={updating === participant.id}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

            </div>
            <BottomNav />
        </div>
    )
}
