"use client"

import { useAttendanceActivityDialog } from "@/hooks/activities/use-attendance-activity-dialog"
import { AttendanceStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Users,
  XCircle,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { useEffect, useMemo, useState } from "react"

interface TakeAttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activityId: number
  onAttendanceUpdated?: () => void
}

const STATUS_ACTIONS = [
  {
    status: AttendanceStatus.PRESENT,
    label: "Presente",
    icon: CheckCircle2,
    active: "bg-green-600 border-green-600 text-white hover:bg-green-700 hover:text-white",
    inactive:
      "border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 " +
      "dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950/40 dark:hover:text-green-300",
  },
  {
    status: AttendanceStatus.LATE,
    label: "Tardanza",
    icon: Clock3,
    active: "bg-yellow-500 border-yellow-500 text-white hover:bg-yellow-600 hover:text-white",
    inactive:
      "border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800 " +
      "dark:border-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-950/40 dark:hover:text-yellow-300",
  },
  {
    status: AttendanceStatus.ABSENT,
    label: "Ausente",
    icon: XCircle,
    active: "bg-red-600 border-red-600 text-white hover:bg-red-700 hover:text-white",
    inactive:
      "border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 " +
      "dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300",
  },
] as const

export function TakeAttendanceDialog({
  open,
  onOpenChange,
  activityId,
  onAttendanceUpdated,
}: TakeAttendanceDialogProps) {
  const [attendanceQueueIds, setAttendanceQueueIds] = useState<number[]>([])
  const [hasInitializedQueue, setHasInitializedQueue] = useState(false)

  const {
    activityAttendances,
    isLoading,
    error,
    isAttending,
    updatingAttendanceId,
    stats,
    handleMarkStatus,
    handleClose,
  } = useAttendanceActivityDialog(activityId, open, onOpenChange, onAttendanceUpdated)

  useEffect(() => {
    if (!open) {
      setAttendanceQueueIds([])
      setHasInitializedQueue(false)
      return
    }

    if (!hasInitializedQueue && activityAttendances.length > 0) {
      setAttendanceQueueIds(activityAttendances.map((attendance) => attendance.id))
      setHasInitializedQueue(true)
    }
  }, [open, hasInitializedQueue, activityAttendances])

  const queuedAttendances = useMemo(
    () =>
      attendanceQueueIds
        .map((id) => activityAttendances.find((attendance) => attendance.id === id))
        .filter((attendance): attendance is (typeof activityAttendances)[number] => attendance !== undefined),
    [attendanceQueueIds, activityAttendances],
  )

  const handleAttendanceClick = async (
    attendanceId: number,
    currentStatus: AttendanceStatus,
    nextStatus: AttendanceStatus,
  ) => {
    if (currentStatus === nextStatus) {
      return
    }

    const success = await handleMarkStatus(attendanceId, nextStatus)
    if (success) {
      setAttendanceQueueIds((currentQueue) => currentQueue.filter((id) => id !== attendanceId))
    }
  }

  const summaryChips = [
    { label: "presentes", value: stats.present, className: "bg-green-500/10 text-green-600 dark:text-green-400" },
    { label: "tardanzas", value: stats.late, className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
    { label: "ausentes", value: stats.absent, className: "bg-red-500/10 text-red-600 dark:text-red-400" },
    { label: "pendientes", value: stats.pending, className: "bg-muted text-muted-foreground" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="pr-10">Tomar Asistencia</DialogTitle>
          <DialogDescription>
            Marcá el estado de cada participante. Al marcarlo, sale de la lista.
          </DialogDescription>
          {!isLoading && !error && activityAttendances.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {summaryChips.map((chip) => (
                <span
                  key={chip.label}
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    chip.className,
                  )}
                >
                  {chip.value} {chip.label}
                </span>
              ))}
            </div>
          )}
        </DialogHeader>

        <DialogBody>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <span>Cargando asistencias…</span>
            </div>
          ) : error ? (
            <div className="flex h-48 items-center justify-center gap-2 text-destructive">
              <AlertCircle className="size-6" />
              <span>Error: {error}</span>
            </div>
          ) : queuedAttendances.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
              {activityAttendances.length === 0 ? (
                <>
                  <Users className="size-10 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay participantes inscritos</p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-10 text-green-600" />
                  <p className="font-medium">Asistencia completa</p>
                  <p className="text-sm text-muted-foreground">
                    Todos los participantes fueron marcados.
                  </p>
                </>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {queuedAttendances.map((attendance) => {
                const isUpdatingRow = updatingAttendanceId === attendance.id

                return (
                  <li
                    key={attendance.id}
                    className="rounded-xl border bg-card p-3 shadow-sm sm:p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9 shrink-0">
                          <AvatarFallback className="text-xs font-medium">
                            {`${attendance.firstName?.[0] ?? ""}${attendance.lastName?.[0] ?? ""}`}
                          </AvatarFallback>
                        </Avatar>
                        <p className="min-w-0 truncate font-medium">
                          {attendance.firstName} {attendance.lastName}
                        </p>
                        {isUpdatingRow && (
                          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 sm:flex sm:shrink-0">
                        {STATUS_ACTIONS.map(({ status, label, icon: Icon, active, inactive }) => {
                          const isActive = attendance.status === status
                          return (
                            <Button
                              key={status}
                              size="sm"
                              variant="outline"
                              aria-pressed={isActive}
                              className={cn(
                                "rounded-full bg-transparent px-2.5 text-xs",
                                isActive ? active : inactive,
                              )}
                              disabled={isAttending}
                              onClick={() => handleAttendanceClick(attendance.id, attendance.status, status)}
                            >
                              <Icon className="hidden sm:block" />
                              <span>{label}</span>
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </DialogBody>

        <DialogFooter className="sm:items-center sm:justify-between">
          {!isLoading && !error && queuedAttendances.length > 0 && (
            <p className="text-center text-sm text-muted-foreground sm:text-left">
              {queuedAttendances.length} sin marcar
            </p>
          )}
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isAttending}
            className="bg-transparent"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
