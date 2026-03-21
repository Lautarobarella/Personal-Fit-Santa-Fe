"use client"

import { useAttendanceActivityDialog } from "@/hooks/activities/use-attendance-activity-dialog"
import { AttendanceStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  Loader2,
  Users,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
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
    formatDateTime,
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

  const getButtonClassName = (currentStatus: AttendanceStatus, targetStatus: AttendanceStatus) => {
    const isActive = currentStatus === targetStatus

    switch (targetStatus) {
      case AttendanceStatus.PRESENT:
        return cn(
          "border-green-200",
          isActive
            ? "bg-green-600 text-white hover:bg-green-700 hover:text-white"
            : "bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800",
        )
      case AttendanceStatus.LATE:
        return cn(
          "border-yellow-200",
          isActive
            ? "bg-yellow-500 text-white hover:bg-yellow-600 hover:text-white"
            : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800",
        )
      case AttendanceStatus.ABSENT:
      default:
        return cn(
          "border-red-200",
          isActive
            ? "bg-red-600 text-white hover:bg-red-700 hover:text-white"
            : "bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800",
        )
    }
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="mt-4">Tomar Asistencia</DialogTitle>
            <DialogDescription>
              Marca o corrige la asistencia de cada participante desde este panel.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando asistencias...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <span className="ml-2 text-destructive">Error: {error}</span>
              </div>
            ) : (
              <>
                <div className="m-2 space-y-2">
                  <h3 className="text-lg font-semibold">Lista de Participantes</h3>
                </div>

                <div className="space-y-2">
                  {queuedAttendances.map((attendance) => (
                    <Card key={attendance.id} className="m-2">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {`${attendance.firstName?.[0] ?? ""}${attendance.lastName?.[0] ?? ""}`}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {attendance.firstName} {attendance.lastName}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 ml-11 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className={getButtonClassName(attendance.status, AttendanceStatus.PRESENT)}
                            disabled={isAttending}
                            onClick={() =>
                              handleAttendanceClick(attendance.id, attendance.status, AttendanceStatus.PRESENT)
                            }
                          >
                            {updatingAttendanceId === attendance.id && <Loader2 className="h-3 w-3 animate-spin" />}
                            Pres
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={getButtonClassName(attendance.status, AttendanceStatus.LATE)}
                            disabled={isAttending}
                            onClick={() =>
                              handleAttendanceClick(attendance.id, attendance.status, AttendanceStatus.LATE)
                            }
                          >
                            {updatingAttendanceId === attendance.id && <Loader2 className="h-3 w-3 animate-spin" />}
                            Tard
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={getButtonClassName(attendance.status, AttendanceStatus.ABSENT)}
                            disabled={isAttending}
                            onClick={() =>
                              handleAttendanceClick(attendance.id, attendance.status, AttendanceStatus.ABSENT)
                            }
                          >
                            {updatingAttendanceId === attendance.id && <Loader2 className="h-3 w-3 animate-spin" />}
                            Aus
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {queuedAttendances.length === 0 && (
                    <Card className="m-2 h-[35vh] flex items-center justify-center">
                      <CardContent className="flex flex-col items-center justify-center h-full">
                        <Users className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          {activityAttendances.length === 0
                            ? "No hay participantes inscritos"
                            : "No quedan participantes en esta ronda"}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t mt-4 pt-6">
            <Button variant="outline" onClick={handleClose} disabled={isAttending} className="bg-transparent">
              Cerrar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
