"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Users,
  MapPin,
  User,
  Edit,
  Trash2,
  UserCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Dumbbell,
  Gauge,
  Loader2,
  MailWarningIcon,
} from "lucide-react"
import { useActivityContext } from "@/contexts/activity-provider"
import { useAuth } from "@/contexts/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { getMuscleGroupLabels } from "@/lib/muscle-groups"
import { ActivityStatus, AttendanceStatus, UserRole } from "@/lib/types"

interface DetailsActivityDialogProps {
  _open: boolean
  onOpenChange: (_open: boolean) => void
  activityId: number
  onEdit?: () => void
  onDelete?: () => void
}

export function DetailsActivityDialog({ _open: isOpen, onOpenChange, activityId, onEdit, onDelete }: DetailsActivityDialogProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [visibleSummaryAttendanceId, setVisibleSummaryAttendanceId] = useState<number | null>(null)
  const [isTakeAttendanceOpen, setIsTakeAttendanceOpen] = useState(false)
  const [attendanceQueueIds, setAttendanceQueueIds] = useState<number[]>([])
  const [updatingAttendanceId, setUpdatingAttendanceId] = useState<number | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const {
    selectedActivity,
    loadActivityDetail,
    markParticipantAttendance,
  } = useActivityContext()

  useEffect(() => {
    loadActivityDetail(activityId)
  }, [activityId, loadActivityDetail])

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("overview")
      setVisibleSummaryAttendanceId(null)
      setIsTakeAttendanceOpen(false)
      setAttendanceQueueIds([])
    }
  }, [isOpen])


  if (!selectedActivity) {
    return null
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date))
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case ActivityStatus.ACTIVE:
        return "Activa"
      case ActivityStatus.CANCELLED:
        return "Cancelada"
      case ActivityStatus.COMPLETED:
        return "Completada"
      default:
        return status
    }
  }

  const canTakeAttendance = user?.role === UserRole.ADMIN
  const attendanceStatusOptions: AttendanceStatus[] = [
    AttendanceStatus.PRESENT,
    AttendanceStatus.ABSENT,
    AttendanceStatus.LATE,
    AttendanceStatus.PENDING,
  ]

  const getAttendanceStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return "Presente"
      case AttendanceStatus.ABSENT:
        return "Ausente"
      case AttendanceStatus.LATE:
        return "Tarde"
      case AttendanceStatus.PENDING:
      default:
        return "Pendiente"
    }
  }

  const getAttendanceStatusSelectClass = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return "border-green-200 bg-green-50 text-green-700"
      case AttendanceStatus.ABSENT:
        return "border-red-200 bg-red-50 text-red-700"
      case AttendanceStatus.LATE:
        return "border-slate-300 bg-slate-100 text-slate-700"
      case AttendanceStatus.PENDING:
      default:
        return "border-yellow-200 bg-yellow-50 text-yellow-700"
    }
  }

  const getAttendanceBadge = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return (
          <Badge variant={"success"}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Presente
          </Badge>
        )
      case AttendanceStatus.ABSENT:
        return (
          <Badge variant={"destructive"}>
            <AlertCircle className="h-3 w-3 mr-1" />
            Ausente
          </Badge>
        )
      case AttendanceStatus.LATE:
        return (
          <Badge variant={"secondary"}>
            <AlertCircle className="h-3 w-3 mr-1" />
            Tarde
          </Badge>
        )
      case AttendanceStatus.PENDING:
      default:
        return (
          <Badge variant={"warning"}>
            <MailWarningIcon className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        )
    }
  }

  const updateAttendanceStatus = async (
    attendanceId: number,
    status: AttendanceStatus,
    options?: { removeFromQueue?: boolean; successMessage?: string },
  ) => {
    if (!canTakeAttendance) {
      return
    }

    setUpdatingAttendanceId(attendanceId)
    try {
      const result = await markParticipantAttendance(attendanceId, status)

      if (!result.success) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
        return
      }

      await loadActivityDetail(activityId)
      if (options?.removeFromQueue) {
        setAttendanceQueueIds((currentQueue) => currentQueue.filter((id) => id !== attendanceId))
      }

      toast({
        title: "Asistencia actualizada",
        description: options?.successMessage || "El estado de asistencia fue actualizado.",
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar la asistencia.",
        variant: "destructive",
      })
    } finally {
      setUpdatingAttendanceId(null)
    }
  }

  const participantsNotPresent = selectedActivity.participants.filter(
    (participant) => participant.status !== AttendanceStatus.PRESENT,
  )

  const openTakeAttendanceDialog = () => {
    if (!canTakeAttendance) {
      return
    }

    const pendingAttendanceIds = participantsNotPresent.map((participant) => participant.id)

    setAttendanceQueueIds(pendingAttendanceIds)
    setIsTakeAttendanceOpen(true)
  }

  const participantsToProcess = selectedActivity.participants.filter((participant) =>
    attendanceQueueIds.includes(participant.id),
  )

  const presentParticipants = selectedActivity.participants.filter((p) => p.status === AttendanceStatus.PRESENT)
  const absentParticipants = selectedActivity.participants.filter((p) => p.status === AttendanceStatus.ABSENT)
  const occupancyRate = Math.round((selectedActivity.currentParticipants / selectedActivity.maxParticipants) * 100)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between mt-4">
            <div className="flex items-center gap-2 justify-between w-full">
              <div className="flex gap-1">
                {onEdit && (
                  <Button size="sm" variant="outline" disabled={selectedActivity.status === ActivityStatus.COMPLETED} onClick={onEdit}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button size="sm" variant="outline" disabled={selectedActivity.status === ActivityStatus.COMPLETED} onClick={onDelete} className="text-error bg-transparent">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex-1 flex justify-end">
                <Badge>{getStatusText(selectedActivity.status)}</Badge>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <DialogTitle className="text-xl mb-2 flex">{selectedActivity.name}</DialogTitle>
            <DialogDescription >{selectedActivity.description}</DialogDescription>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="attendance">Asistencia</TabsTrigger>
            <TabsTrigger value="details">Detalles</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-2">
              {/* Basic Info Card */}
              <Card className="m-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Fecha:</span>
                      <p className="font-medium">{formatDate(selectedActivity.date)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hora:</span>
                      <p className="font-medium">{formatTime(selectedActivity.date)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duración:</span>
                      <p className="font-medium">{selectedActivity.duration} minutos</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <span className="text-muted-foreground text-sm">Entrenador:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {selectedActivity.trainerName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {selectedActivity.trainerName}
                      </span>
                    </div>
                  </div>

                  {selectedActivity.location && (
                    <div>
                      <span className="text-muted-foreground text-sm">Ubicación:</span>
                      <p className="font-medium flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" />
                        Gimnasio principal
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="m-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{selectedActivity.currentParticipants}</div>
                      <div className="text-sm text-muted-foreground">Inscritos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary">{occupancyRate}%</div>
                      <div className="text-sm text-muted-foreground">Ocupación</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary">{presentParticipants.length}</div>
                      <div className="text-sm text-muted-foreground">Asistieron</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{absentParticipants.length}</div>
                      <div className="text-sm text-muted-foreground">Pendientes</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Capacidad</span>
                      <span>
                        {selectedActivity.currentParticipants}/{selectedActivity.maxParticipants}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Equipment and Notes 
            {(selectedActivity.equipment?.length || selectedActivity.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Adicional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedActivity.equipment?.length && (
                    <div>
                      <span className="text-muted-foreground text-sm">Equipamiento necesario:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedActivity.equipment.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedActivity.notes && (
                    <div>
                      <span className="text-muted-foreground text-sm">Notas:</span>
                      <p className="text-sm mt-1 p-2 bg-muted rounded">{selectedActivity.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}*/}
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="attendance" className="space-y-4 mt-4">
            <div className="m-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-left">Lista de Participantes</h3>
                {canTakeAttendance && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent"
                    disabled={participantsNotPresent.length === 0}
                    onClick={openTakeAttendanceDialog}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Tomar Asistencia
                  </Button>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Badge variant={"success"}>{presentParticipants.length} Presentes</Badge>
                <Badge variant="destructive">{absentParticipants.length} Ausentes</Badge>
              </div>
            </div>

            <div className="space-y-2">
              {selectedActivity.participants.map((p) => (

                <Card key={p.id } className="m-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {`${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{p.firstName + " " + p.lastName}</p>
                          {p.createdAt && (
                            <p className="text-xs text-muted-foreground">
                              Inscrito: {formatDateTime(p.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canTakeAttendance ? (
                          <Select
                            key={`${p.id}-${p.status}`}
                            disabled={updatingAttendanceId !== null}
                            onValueChange={(value) => {
                              const nextStatus = value as AttendanceStatus
                              updateAttendanceStatus(p.id, nextStatus, {
                                successMessage: `${p.firstName} ${p.lastName} fue marcado como ${getAttendanceStatusLabel(nextStatus).toLowerCase()}.`,
                              })
                            }}
                          >
                            <SelectTrigger
                              className={`h-8 min-w-[132px] rounded-full px-3 text-xs font-medium ${getAttendanceStatusSelectClass(p.status)}`}
                            >
                              <SelectValue placeholder={getAttendanceStatusLabel(p.status)} />
                            </SelectTrigger>
                            <SelectContent align="end">
                              {attendanceStatusOptions
                                .filter((status) => status !== p.status)
                                .map((status) => (
                                  <SelectItem key={`${p.id}-${status}`} value={status}>
                                    {getAttendanceStatusLabel(status)}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          getAttendanceBadge(p.status)
                        )}
                      </div>
                    </div>
                    <div className="mt-3 ml-11">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!p.summary}
                        className="bg-transparent"
                        onClick={() => setVisibleSummaryAttendanceId((currentId) => currentId === p.id ? null : p.id)}
                      >
                        {visibleSummaryAttendanceId === p.id ? "Ocultar resumen" : "Ver resumen"}
                      </Button>
                    </div>
                    {p.summary && visibleSummaryAttendanceId === p.id && (
                      <div className="mt-3 ml-11 p-3 rounded-md border bg-muted/40 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                            <Dumbbell className="h-3 w-3" />
                            Resumen
                          </p>
                          <Badge variant="outline" className="text-xs">
                            <Gauge className="h-3 w-3 mr-1" />
                            {p.summary.effortLevel}/10
                          </Badge>
                        </div>
                        <p className="text-sm">
                          <span className="font-medium">Grupo:</span>{" "}
                          {getMuscleGroupLabels(
                            p.summary.muscleGroups?.length
                              ? p.summary.muscleGroups
                              : p.summary.muscleGroup
                                ? [p.summary.muscleGroup]
                                : [],
                          ).join(", ") || "No informado"}
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {p.summary.trainingDescription}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {selectedActivity.participants.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No hay participantes inscritos</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <Card className="m-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información de Creación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Creado por:</span>
                    <p className="font-medium">{selectedActivity.createdBy || "Sistema"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha de creación:</span>
                    <p className="font-medium">
                      {selectedActivity.createdAt ? formatDateTime(selectedActivity.createdAt) : "No disponible"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Última modificación:</span>
                    <p className="font-medium">
                      {selectedActivity.lastModified ? formatDateTime(selectedActivity.lastModified) : "No modificada"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID de actividad:</span>
                    <p className="font-medium font-mono text-xs">{selectedActivity.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="m-2">
              <CardHeader>
                <CardTitle className="text-lg">Configuración Avanzada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <p className="font-medium">{getStatusText(selectedActivity.status)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Capacidad máxima:</span>
                    <p className="font-medium">{selectedActivity.maxParticipants} personas</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duración total:</span>
                    <p className="font-medium">
                      {Math.floor(selectedActivity.duration / 60)}h {selectedActivity.duration % 60}m
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog
          open={isTakeAttendanceOpen}
          onOpenChange={(open) => {
            setIsTakeAttendanceOpen(open)
            if (!open) {
              setAttendanceQueueIds([])
            }
          }}
        >
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="mt-4">Tomar Asistencia</DialogTitle>
              <DialogDescription>
                Marca asistencia cliente por cliente. Solo se listan quienes no estan en estado Presente.
              </DialogDescription>
            </DialogHeader>

            {participantsToProcess.length > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-end">
                  <Badge variant="outline">{participantsToProcess.length} pendientes</Badge>
                </div>
                {participantsToProcess.map((participant) => (
                  <Card key={participant.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {`${participant.firstName[0] ?? ""}${participant.lastName[0] ?? ""}`}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium truncate">{participant.firstName} {participant.lastName}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            disabled={updatingAttendanceId !== null}
                            onClick={() =>
                              updateAttendanceStatus(participant.id, AttendanceStatus.PRESENT, {
                                removeFromQueue: true,
                                successMessage: `${participant.firstName} ${participant.lastName} fue marcado como presente.`,
                              })
                            }
                          >
                            {updatingAttendanceId === participant.id && <Loader2 className="h-3 w-3 animate-spin" />}
                            Asistió
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2.5 text-xs"
                            disabled={updatingAttendanceId !== null}
                            onClick={() =>
                              updateAttendanceStatus(participant.id, AttendanceStatus.ABSENT, {
                                removeFromQueue: true,
                                successMessage: `${participant.firstName} ${participant.lastName} fue marcado como ausente.`,
                              })
                            }
                          >
                            {updatingAttendanceId === participant.id && <Loader2 className="h-3 w-3 animate-spin" />}
                            No asistió
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle className="h-10 w-10 mx-auto mb-2 text-success" />
                  <p className="font-medium">No quedan clientes pendientes</p>
                  <p className="text-sm text-muted-foreground">Todas las asistencias de esta ronda ya fueron marcadas.</p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsTakeAttendanceOpen(false)}>
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}


