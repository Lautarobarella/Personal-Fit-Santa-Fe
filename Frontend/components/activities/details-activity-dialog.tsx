"use client"

import { TakeAttendanceDialog } from "@/components/activities/take-attendance-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useActivityDetailsDialog } from "@/hooks/activities/use-activity-details-dialog"
import { getMuscleGroupLabels } from "@/lib/muscle-groups"
import { ActivityStatus, AttendanceStatus } from "@/lib/types"
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock3,
  Dumbbell,
  Edit,
  Gauge,
  MailWarningIcon,
  MapPin,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  Users,
} from "lucide-react"

interface DetailsActivityDialogProps {
  _open: boolean
  onOpenChange: (_open: boolean) => void
  activityId: number
  onEdit?: () => void
  onDelete?: () => void
}

export function DetailsActivityDialog({
  _open: isOpen,
  onOpenChange,
  activityId,
  onEdit,
  onDelete,
}: DetailsActivityDialogProps) {
  const {
    activeTab,
    setActiveTab,
    visibleSummaryAttendanceId,
    toggleSummaryVisibility,
    isTakeAttendanceOpen,
    setIsTakeAttendanceOpen,
    updatingAttendanceId,
    selectedActivity,
    formatDate,
    formatTime,
    formatDateTime,
    getStatusText,
    canTakeAttendance,
    attendanceStatusOptions,
    getAttendanceStatusLabel,
    getAttendanceStatusSelectClass,
    updateAttendanceStatus,
    openTakeAttendanceDialog,
    presentParticipants,
    lateParticipants,
    absentParticipants,
    occupancyRate,
    reloadActivityDetail,
  } = useActivityDetailsDialog(activityId, isOpen)

  const getAttendanceBadge = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return (
          <Badge variant="success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Presente
          </Badge>
        )
      case AttendanceStatus.ABSENT:
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Ausente
          </Badge>
        )
      case AttendanceStatus.LATE:
        return (
          <Badge className="border-transparent bg-yellow-500 text-white hover:bg-yellow-500">
            <Clock3 className="h-3 w-3 mr-1" />
            Tardanza
          </Badge>
        )
      case AttendanceStatus.PENDING:
      default:
        return (
          <Badge variant="warning">
            <MailWarningIcon className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        )
    }
  }

  if (!selectedActivity) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between mt-4">
              <div className="flex items-center gap-2 justify-between w-full">
                <div className="flex gap-1">
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={selectedActivity.status === ActivityStatus.COMPLETED}
                      onClick={onEdit}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={selectedActivity.status === ActivityStatus.COMPLETED}
                      onClick={onDelete}
                      className="text-error bg-transparent"
                    >
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
              <DialogDescription>{selectedActivity.description}</DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="attendance">Asistencia</TabsTrigger>
                <TabsTrigger value="details">Detalles</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-2">
                  <Card className="m-2">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Informacion Basica
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
                          <span className="text-muted-foreground">Duracion:</span>
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
                          <span className="font-medium">{selectedActivity.trainerName}</span>
                        </div>
                      </div>

                      {selectedActivity.location && (
                        <div>
                          <span className="text-muted-foreground text-sm">Ubicacion:</span>
                          <p className="font-medium flex items-center gap-1 mt-1">
                            <MapPin className="h-4 w-4" />
                            Gimnasio principal
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="m-2">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Estadisticas
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
                          <div className="text-sm text-muted-foreground">Ocupacion</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-secondary">{presentParticipants.length}</div>
                          <div className="text-sm text-muted-foreground">Asistieron</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{absentParticipants.length}</div>
                          <div className="text-sm text-muted-foreground">Ausentes</div>
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
              </TabsContent>

              <TabsContent value="attendance" className="space-y-4 mt-4">
                <div className="m-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-left">Lista de Participantes</h3>
                    {canTakeAttendance && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent"
                        onClick={openTakeAttendanceDialog}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Tomar Asistencia
                      </Button>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 flex-wrap">
                    <Badge variant="success">{presentParticipants.length} Presentes</Badge>
                    <Badge className="border-transparent bg-yellow-500 text-white hover:bg-yellow-500">
                      {lateParticipants.length} Tardanzas
                    </Badge>
                    <Badge variant="destructive">{absentParticipants.length} Ausentes</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedActivity.participants.map((participant) => (
                    <Card key={participant.id} className="m-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {`${participant.firstName[0] ?? ""}${participant.lastName[0] ?? ""}`}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{participant.firstName} {participant.lastName}</p>
                              {participant.createdAt && (
                                <p className="text-xs text-muted-foreground">
                                  Inscrito: {formatDateTime(participant.createdAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        <div className="flex items-center gap-2">
                          {canTakeAttendance ? (
                            <Select
                              key={`${participant.id}-${participant.status}`}
                              disabled={updatingAttendanceId !== null}
                              onValueChange={(value) => {
                                const nextStatus = value as AttendanceStatus
                                updateAttendanceStatus(participant.id, nextStatus, {
                                  successMessage: `${participant.firstName} ${participant.lastName} fue marcado como ${getAttendanceStatusLabel(nextStatus).toLowerCase()}.`,
                                })
                              }}
                            >
                              <SelectTrigger
                                className={`h-8 w-auto rounded-full px-2.5 text-xs font-medium ${getAttendanceStatusSelectClass(participant.status)}`}
                              >
                                <SelectValue placeholder={getAttendanceStatusLabel(participant.status)} />
                              </SelectTrigger>
                              <SelectContent align="end">
                                {attendanceStatusOptions
                                  .filter((status) => status !== participant.status)
                                  .map((status) => (
                                    <SelectItem key={`${participant.id}-${status}`} value={status}>
                                      {getAttendanceStatusLabel(status)}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            getAttendanceBadge(participant.status)
                          )}
                          </div>
                        </div>
                        <div className="mt-3 ml-11">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!participant.summary}
                            className="bg-transparent"
                            onClick={() => toggleSummaryVisibility(participant.id)}
                          >
                            {visibleSummaryAttendanceId === participant.id ? "Ocultar resumen" : "Ver resumen"}
                          </Button>
                        </div>
                        {participant.summary && visibleSummaryAttendanceId === participant.id && (
                          <div className="mt-3 ml-11 p-3 rounded-md border bg-muted/40 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                                <Dumbbell className="h-3 w-3" />
                                Resumen
                              </p>
                              <Badge variant="outline" className="text-xs">
                                <Gauge className="h-3 w-3 mr-1" />
                                {participant.summary.effortLevel}/10
                              </Badge>
                            </div>
                            <p className="text-sm">
                              <span className="font-medium">Grupo:</span>{" "}
                              {getMuscleGroupLabels(
                                participant.summary.muscleGroups?.length
                                  ? participant.summary.muscleGroups
                                  : participant.summary.muscleGroup
                                    ? [participant.summary.muscleGroup]
                                    : [],
                              ).join(", ") || "No informado"}
                            </p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {participant.summary.trainingDescription}
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

              <TabsContent value="details" className="space-y-4 mt-4">
                <Card className="m-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informacion de Creacion
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Creado por:</span>
                        <p className="font-medium">{selectedActivity.createdBy || "Sistema"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fecha de creacion:</span>
                        <p className="font-medium">
                          {selectedActivity.createdAt ? formatDateTime(selectedActivity.createdAt) : "No disponible"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ultima modificacion:</span>
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
                    <CardTitle className="text-lg">Configuracion Avanzada</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Estado:</span>
                        <p className="font-medium">{getStatusText(selectedActivity.status)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Capacidad maxima:</span>
                        <p className="font-medium">{selectedActivity.maxParticipants} personas</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duracion total:</span>
                        <p className="font-medium">
                          {Math.floor(selectedActivity.duration / 60)}h {selectedActivity.duration % 60}m
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <TakeAttendanceDialog
            open={isTakeAttendanceOpen}
            onOpenChange={setIsTakeAttendanceOpen}
            activityId={activityId}
            onAttendanceUpdated={reloadActivityDetail}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
