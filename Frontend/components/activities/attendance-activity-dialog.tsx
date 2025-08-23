


"use client"

import { useActivityContext } from "@/components/providers/activity-provider"
import { useToast } from "@/hooks/use-toast"
import { AttendanceStatus } from "@/lib/types"
import { AlertCircle, CheckCircle, Loader2, MailWarningIcon, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "../providers/auth-provider"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog"

interface AttendanceActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activityId: number
  onAttendance?: () => void
}

export function AttendanceActivityDialog({ open, onOpenChange, activityId }: AttendanceActivityDialogProps) {
  const { user } = useAuth()
  const [isAttending, setIsAttending] = useState(false)
  const { toast } = useToast()
  const { selectedActivity, loadActivityDetail, markParticipantAttendance } = useActivityContext()

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
      const result = await markParticipantAttendance(selectedActivity.id, participantId, AttendanceStatus.PRESENT)
      
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
      const result = await markParticipantAttendance(selectedActivity.id, participantId, AttendanceStatus.ABSENT)
      
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
      const result = await markParticipantAttendance(selectedActivity.id, participantId, AttendanceStatus.LATE)
      
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center mt-4">
            Asistencias: "{selectedActivity.name}"
          </DialogTitle>
          <DialogDescription className="flex">
            A continuación se muestra la lista de participantes inscriptos:
          </DialogDescription>
        </DialogHeader>

        {/* Sección de asistencia del profesor (solo admin)
        {user?.role === "ADMIN" && (
          <div className="m-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">Asistencia del Profesor</h3>
            <Card className="m-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {`${trainer.firstName[0] ?? ""}${trainer.lastName[0] ?? ""}`}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{trainer.firstName + " " + trainer.lastName}</p>
                  {trainer.status === AttendanceStatus.PRESENT && (
                    <Badge variant={'success'} className="ml-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Presente
                    </Badge>
                  )}
                  {trainer.status === AttendanceStatus.ABSENT && (
                    <Badge variant={'destructive'} className="ml-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Ausente
                    </Badge>
                  )}
                  {trainer.status === AttendanceStatus.PENDING && (
                    <Badge variant={'warning'} className="ml-2">
                      <MailWarningIcon className="h-3 w-3 mr-1" />
                      Pendiente
                    </Badge>
                  )}
                  {trainer.status === AttendanceStatus.LATE && (
                    <Badge variant={'secondary'} className="ml-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Tardanza
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1 ml-11">
                  {trainer.status === AttendanceStatus.PRESENT && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAbsent(trainer.id)}
                        disabled={isAttending}
                      >
                        {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Ausente
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkLate(trainer.id)}
                        disabled={isAttending}
                      >
                        {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Tardanza
                      </Button>
                    </>
                  )}
                  {(trainer.status === AttendanceStatus.PENDING || trainer.status === AttendanceStatus.ABSENT) && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkPresent(trainer.id)}
                        disabled={isAttending}
                      >
                        {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Presente
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkLate(trainer.id)}
                        disabled={isAttending}
                      >
                        {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Tardanza
                      </Button>
                    </>
                  )}
                  {trainer.status === AttendanceStatus.LATE && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkPresent(trainer.id)}
                        disabled={isAttending}
                      >
                        {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Presente
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAbsent(trainer.id)}
                        disabled={isAttending}
                      >
                        {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Ausente
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )} */}

        {/* Lista de participantes (excluyendo al profesor) */}
        <div className="m-4">
          <h3 className="text-lg font-semibold mb-2">Lista de Participantes</h3>
          <div className="flex gap-2 text-sm flex-wrap">
            <Badge variant="success">
              {selectedActivity.participants.filter(p => p.status === AttendanceStatus.PRESENT && p.id !== selectedActivity.trainerId).length} Presentes
            </Badge>
            <Badge variant="destructive">
              {selectedActivity.participants.filter(p => p.status === AttendanceStatus.ABSENT && p.id !== selectedActivity.trainerId).length} Ausentes
            </Badge>
            <Badge variant="secondary">
              {selectedActivity.participants.filter(p => p.status === AttendanceStatus.LATE && p.id !== selectedActivity.trainerId).length} Tardanzas
            </Badge>
            <Badge variant="warning">
              {selectedActivity.participants.filter(p => p.status === AttendanceStatus.PENDING && p.id !== selectedActivity.trainerId).length} Pendientes
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          {selectedActivity.participants.map((p) => (
            <Card key={p.id} className="m-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {`${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{p.firstName + " " + p.lastName}</p>
                  {p.status === AttendanceStatus.PRESENT && (
                    <Badge variant={'success'} className="ml-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Presente
                    </Badge>
                  )}
                  {p.status === AttendanceStatus.ABSENT && (
                    <Badge variant={'destructive'} className="ml-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Ausente
                    </Badge>
                  )}
                  {p.status === AttendanceStatus.PENDING && (
                    <Badge variant={'warning'} className="ml-2">
                      <MailWarningIcon className="h-3 w-3 mr-1" />
                      Pendiente
                    </Badge>
                  )}
                  {p.status === AttendanceStatus.LATE && (
                    <Badge variant={'secondary'} className="ml-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Tardanza
                    </Badge>
                  )}
                </div>
                {p.createdAt && (
                  <p className="text-xs text-muted-foreground mb-2 ml-11">
                    Inscrito: {formatDateTime(p.createdAt)}
                  </p>
                )}
                <div className="flex gap-1 ml-11">
                  {/* Botones para marcar asistencia */}
                  {p.status === AttendanceStatus.PRESENT && (
                    <>
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
                    </>
                  )}
                  {(p.status === AttendanceStatus.PENDING || p.status === AttendanceStatus.ABSENT) && (
                    <>
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
                    </>
                  )}
                  {p.status === AttendanceStatus.LATE && (
                    <>
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
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {selectedActivity.participants.length === 0 && (
            <Card className="m-4 h-[35vh] flex items-center justify-center">
              <CardContent className="flex flex-col items-center justify-center h-full">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
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
