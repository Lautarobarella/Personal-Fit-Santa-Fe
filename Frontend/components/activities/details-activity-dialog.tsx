"use client"

import { TakeAttendanceDialog } from "@/components/activities/take-attendance-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useActivityDetailsDialog } from "@/hooks/activities/use-activity-details-dialog"
import { getMuscleGroupLabels } from "@/lib/muscle-groups"
import { ActivityStatus, AttendanceStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock3,
  Dumbbell,
  Edit,
  Gauge,
  MailWarningIcon,
  Trash2,
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

const STATUS_BADGE_CLASSES: Record<ActivityStatus, string> = {
  [ActivityStatus.ACTIVE]: "bg-green-500/10 text-green-600 dark:text-green-400 border-transparent",
  [ActivityStatus.COMPLETED]: "bg-muted text-muted-foreground border-transparent",
  [ActivityStatus.CANCELLED]: "bg-red-500/10 text-red-600 dark:text-red-400 border-transparent",
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
    attendedParticipants,
    occupancyRate,
    reloadActivityDetail,
  } = useActivityDetailsDialog(activityId, isOpen)

  const getAttendanceBadge = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return (
          <Badge variant="success">
            <CheckCircle className="size-3 mr-1" />
            Presente
          </Badge>
        )
      case AttendanceStatus.ABSENT:
        return (
          <Badge variant="destructive">
            <AlertCircle className="size-3 mr-1" />
            Ausente
          </Badge>
        )
      case AttendanceStatus.LATE:
        return (
          <Badge className="border-transparent bg-yellow-500 text-white hover:bg-yellow-500">
            <Clock3 className="size-3 mr-1" />
            Tardanza
          </Badge>
        )
      case AttendanceStatus.PENDING:
      default:
        return (
          <Badge variant="warning">
            <MailWarningIcon className="size-3 mr-1" />
            Pendiente
          </Badge>
        )
    }
  }

  if (!selectedActivity) {
    return null
  }

  const scheduleItems = [
    { label: "Fecha", value: formatDate(selectedActivity.date) },
    { label: "Hora", value: formatTime(selectedActivity.date) },
    { label: "Duración", value: `${selectedActivity.duration} min` },
  ]

  const statItems = [
    { label: "Inscritos", value: selectedActivity.currentParticipants },
    { label: "Ocupación", value: `${occupancyRate}%` },
    { label: "Asistieron", value: attendedParticipants.length },
    { label: "Ausentes", value: absentParticipants.length },
  ]

  const creationDetails = [
    { label: "Creado por", value: selectedActivity.createdBy || "Sistema" },
    {
      label: "Fecha de creación",
      value: selectedActivity.createdAt ? formatDateTime(selectedActivity.createdAt) : "No disponible",
    },
    {
      label: "Última modificación",
      value: selectedActivity.lastModified ? formatDateTime(selectedActivity.lastModified) : "No modificada",
    },
    { label: "ID de actividad", value: `#${selectedActivity.id}` },
  ]

  const configDetails = [
    { label: "Estado", value: getStatusText(selectedActivity.status) },
    { label: "Capacidad máxima", value: `${selectedActivity.maxParticipants} personas` },
    {
      label: "Duración total",
      value: `${Math.floor(selectedActivity.duration / 60)}h ${selectedActivity.duration % 60}m`,
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="lg:max-w-3xl">
        <DialogHeader className="pr-14">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="break-words text-xl leading-tight">
                {selectedActivity.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detalles de la actividad {selectedActivity.name}
              </DialogDescription>
              <Badge className={cn("mt-2", STATUS_BADGE_CLASSES[selectedActivity.status])}>
                {getStatusText(selectedActivity.status)}
              </Badge>
            </div>

            {(onEdit || onDelete) && (
              <div className="flex shrink-0 gap-1.5">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selectedActivity.status === ActivityStatus.COMPLETED}
                    onClick={onEdit}
                    aria-label="Editar actividad"
                    className="bg-transparent"
                  >
                    <Edit className="size-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selectedActivity.status === ActivityStatus.COMPLETED}
                    onClick={onDelete}
                    aria-label="Eliminar actividad"
                    className="text-error bg-transparent"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <DialogBody>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="attendance">Asistencia</TabsTrigger>
              <TabsTrigger value="details">Detalles</TabsTrigger>
            </TabsList>

            {/* ── Resumen: toda la información en una sola card ─────────── */}
            <TabsContent value="overview" className="mt-4">
              <div className="divide-y rounded-xl border">
                <div className="grid grid-cols-3 divide-x">
                  {scheduleItems.map(({ label, value }) => (
                    <div key={label} className="px-3 py-4 text-center">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3 px-4 py-4">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs font-medium">
                      {selectedActivity.trainerName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Entrenador</p>
                    <p className="text-sm font-medium">{selectedActivity.trainerName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x sm:grid-cols-4">
                  {statItems.map(({ label, value }) => (
                    <div key={label} className="px-3 py-4 text-center">
                      <p className="text-xl font-semibold">{value}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Capacidad</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="size-3" />
                      {selectedActivity.currentParticipants}/{selectedActivity.maxParticipants}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Asistencia: listado sobrio con divisores ──────────────── */}
            <TabsContent value="attendance" className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Participantes</h3>
                  {selectedActivity.participants.length > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {presentParticipants.length} presentes · {lateParticipants.length} tardanzas ·{" "}
                      {absentParticipants.length} ausentes
                    </p>
                  )}
                </div>
                {canTakeAttendance && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 bg-transparent"
                    onClick={openTakeAttendanceDialog}
                  >
                    <UserCheck className="size-4 mr-2" />
                    Tomar Asistencia
                  </Button>
                )}
              </div>

              {selectedActivity.participants.length > 0 ? (
                <div className="divide-y rounded-xl border">
                  {selectedActivity.participants.map((participant) => (
                    <div key={participant.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="size-9 shrink-0">
                            <AvatarFallback className="text-xs font-medium">
                              {`${participant.firstName[0] ?? ""}${participant.lastName[0] ?? ""}`}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="break-words text-sm font-medium">
                              {participant.firstName} {participant.lastName}
                            </p>
                            {participant.createdAt && (
                              <p className="text-xs text-muted-foreground">
                                Inscrito: {formatDateTime(participant.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
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
                                {attendanceStatusOptions.map((status) =>
                                  status === participant.status ? null : (
                                    <SelectItem key={`${participant.id}-${status}`} value={status}>
                                      {getAttendanceStatusLabel(status)}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          ) : (
                            getAttendanceBadge(participant.status)
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!participant.summary}
                        className="ml-12 mt-1 h-7 px-2 text-xs text-muted-foreground"
                        onClick={() => toggleSummaryVisibility(participant.id)}
                      >
                        {visibleSummaryAttendanceId === participant.id ? (
                          <ChevronUp className="size-3.5 mr-1" />
                        ) : (
                          <ChevronDown className="size-3.5 mr-1" />
                        )}
                        {participant.summary
                          ? visibleSummaryAttendanceId === participant.id
                            ? "Ocultar resumen"
                            : "Ver resumen"
                          : "Sin resumen"}
                      </Button>

                      {participant.summary && visibleSummaryAttendanceId === participant.id && (
                        <div className="ml-12 mt-2 space-y-2 rounded-lg bg-muted/40 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              <Dumbbell className="size-3" />
                              Resumen
                            </p>
                            <Badge variant="outline" className="text-xs">
                              <Gauge className="size-3 mr-1" />
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
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {participant.summary.trainingDescription}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed py-10 text-center">
                  <Users className="mx-auto mb-2 size-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No hay participantes inscritos</p>
                </div>
              )}
            </TabsContent>

            {/* ── Detalles ──────────────────────────────────────────────── */}
            <TabsContent value="details" className="mt-4 space-y-4">
              <div className="rounded-xl border px-4 py-3">
                <h4 className="mb-1 text-sm font-semibold">Información de Creación</h4>
                <dl className="divide-y">
                  {creationDetails.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-xl border px-4 py-3">
                <h4 className="mb-1 text-sm font-semibold">Configuración Avanzada</h4>
                <dl className="divide-y">
                  {configDetails.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </TabsContent>
          </Tabs>
        </DialogBody>

        <TakeAttendanceDialog
          open={isTakeAttendanceOpen}
          onOpenChange={setIsTakeAttendanceOpen}
          activityId={activityId}
          onAttendanceUpdated={reloadActivityDetail}
        />
      </DialogContent>
    </Dialog>
  )
}
