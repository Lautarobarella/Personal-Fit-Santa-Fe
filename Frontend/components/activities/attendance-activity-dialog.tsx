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
import { useToast } from "@/hooks/use-toast"
import { AttendanceStatus } from "@/lib/types"

interface AttendanceActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activityId: number
  onAttendance?: () => void
}

export function AttendanceActivityDialog({ open, onOpenChange, activityId }: AttendanceActivityDialogProps) {
  const [isAttending, setIsAttending] = useState(false)
  const { toast } = useToast()
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
    setIsAttending(true)
    
    try {
      const result = await markParticipantPresent(selectedActivity.id, participantId, AttendanceStatus.PRESENT)
      
      if (result.success) {
        toast({
          title: "Asistencia marcada",
          description: result.message,
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al marcar la asistencia",
        variant: "destructive",
      })
    } finally {
      setIsAttending(false)
    }
  }

  const handleMarkAbsent = async (participantId: number) => {
    setIsAttending(true)
    
    try {
      const result = await markParticipantPresent(selectedActivity.id, participantId, AttendanceStatus.ABSENT)
      
      if (result.success) {
        toast({
          title: "Ausencia marcada",
          description: result.message,
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al marcar la ausencia",
        variant: "destructive",
      })
    } finally {
      setIsAttending(false)
    }
  }

  const handleMarkLate = async (participantId: number) => {
    setIsAttending(true)
    
    try {
      const result = await markParticipantPresent(selectedActivity.id, participantId, AttendanceStatus.LATE)
      
      if (result.success) {
        toast({
          title: "Tardanza marcada",
          description: result.message,
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al marcar la tardanza",
        variant: "destructive",
      })
    } finally {
      setIsAttending(false)
    }
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

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Lista de Participantes</h3>
          <div className="flex gap-2 text-sm">
            <Badge variant="success">
              {selectedActivity.participants.filter(p => p.status === AttendanceStatus.PRESENT).length} Presentes
            </Badge>
            <Badge variant="destructive">
              {selectedActivity.participants.filter(p => p.status === AttendanceStatus.ABSENT).length} Ausentes
            </Badge>
            <Badge variant="secondary">
              {selectedActivity.participants.filter(p => p.status === AttendanceStatus.LATE).length} Tardanzas
            </Badge>
            <Badge variant="warning">
              {selectedActivity.participants.filter(p => p.status === AttendanceStatus.PENDING).length} Pendientes
            </Badge>
          </div>
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
                      {p.status === AttendanceStatus.PRESENT && (
                        <Badge variant={'success'}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Presente
                        </Badge>
                      )}
                      {p.status === AttendanceStatus.ABSENT && (
                        <Badge variant={'destructive'}>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Ausente
                        </Badge>
                      )}
                      {p.status === AttendanceStatus.PENDING && (
                        <Badge variant={'warning'}>
                          <MailWarningIcon className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                      {p.status === AttendanceStatus.LATE && (
                        <Badge variant={'secondary'}>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Tardanza
                        </Badge>
                      )}
                    </>

                    {/* Botones para marcar asistencia */}
                    {p.status === AttendanceStatus.PRESENT && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAbsent(p.id)}
                          disabled={isAttending}
                        >
                          {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          Ausente
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkLate(p.id)}
                          disabled={isAttending}
                        >
                          {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          Tardanza
                        </Button>
                      </div>
                    )}
                    {(p.status === AttendanceStatus.PENDING || p.status === AttendanceStatus.ABSENT) && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkPresent(p.id)}
                          disabled={isAttending}
                        >
                          {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          Presente
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkLate(p.id)}
                          disabled={isAttending}
                        >
                          {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          Tardanza
                        </Button>
                      </div>
                    )}
                    {p.status === AttendanceStatus.LATE && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkPresent(p.id)}
                          disabled={isAttending}
                        >
                          {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          Presente
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAbsent(p.id)}
                          disabled={isAttending}
                        >
                          {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          Ausente
                        </Button>
                      </div>
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
