"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Card, CardContent } from "../ui/card"
import { CheckCircle, AlertCircle, Loader2, Users, MailWarningIcon } from "lucide-react"
import { useActivities } from "@/hooks/use-activity"

interface AttendanceActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activityId: number
  onAttendance?: () => void
}

export function AttendanceActivityDialog({ open, onOpenChange, activityId }: AttendanceActivityDialogProps) {
  const [isAttending, setIsAttending] = useState(false)
  const { selectedActivity, loadActivityDetail, markParticipantPresent } = useActivities()

  useEffect(() => {
    loadActivityDetail(activityId)
  }, [activityId, loadActivityDetail])

  if (!selectedActivity) return null

  const now = new Date()
  const activityStart = new Date(selectedActivity.date)
  const activityEnd = new Date(activityStart.getTime() + selectedActivity.duration * 60000)

  const isFuture = now < activityStart
  const isPast = now > activityEnd

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const handleMarkPresent = async (participantId: number) => {
    markParticipantPresent(selectedActivity, participantId)
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[60vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Asistencia de la actividad: "{selectedActivity.name}"
          </DialogTitle>
          <DialogDescription className="flex">
            A continuación se muestra la lista de participantes inscriptos:
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Lista de Participantes</h3>
        </div>

        <div className="space-y-2">
          {selectedActivity.participants.map((p) => (
            <Card key={p.id}>
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
                    <>
                      {p.status === "present" && (
                        <Badge variant={'success'}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Presente
                        </Badge>
                      )}
                      {p.status === "absent" && (
                        <Badge variant={'destructive'}>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Ausente
                        </Badge>
                      )}
                      {p.status === "pending" && isFuture && (
                        <Badge variant={'warning'}>
                        <MailWarningIcon className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                    </>

                    {/* Botón para marcar como presente solo si es pending y la actividad aún no comenzó */}
                    {(p.status === "pending" || p.status === "absent") && isFuture && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkPresent(p.id)}
                      >
                        Marcar presente
                      </Button>
                    )}
                  </div>
                </div>
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isAttending}>
            Cancelar
          </Button>
          <Button onClick={handleClose} disabled={isAttending}>
            {isAttending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
