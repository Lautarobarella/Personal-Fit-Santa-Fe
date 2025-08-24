


"use client"

import { useAttendance } from "@/hooks/use-attendance"
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
  const { 
    activityAttendances, 
    isLoading, 
    error, 
    loadActivityAttendances, 
    markAttendance,
    getAttendanceStats 
  } = useAttendance()

  useEffect(() => {
    if (open && activityId) {
      loadActivityAttendances(activityId)
    }
  }, [activityId, open, loadActivityAttendances])
  
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando asistencias...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <span className="ml-2 text-destructive">Error: {error}</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const formatDateTime = (date: Date | string) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const stats = getAttendanceStats()

  const handleMarkPresent = async (attendanceId: number) => {
    setIsAttending(true)
    
    try {
      const result = await markAttendance(attendanceId, AttendanceStatus.PRESENT)
      
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

  const handleMarkAbsent = async (attendanceId: number) => {
    setIsAttending(true)
    
    try {
      const result = await markAttendance(attendanceId, AttendanceStatus.ABSENT)
      
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

  const handleMarkLate = async (attendanceId: number) => {
    setIsAttending(true)
    
    try {
      const result = await markAttendance(attendanceId, AttendanceStatus.LATE)
      
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
            Asistencias de Actividad #{activityId}
          </DialogTitle>
          <DialogDescription className="flex">
            A continuación se muestra la lista de participantes inscriptos:
          </DialogDescription>
        </DialogHeader>

        {/* Lista de participantes */}
        <div className="m-4">
          <h3 className="text-lg font-semibold mb-2">Lista de Participantes</h3>
          <div className="flex gap-2 text-sm flex-wrap">
            <Badge variant="success">
              {stats.present} Presentes
            </Badge>
            <Badge variant="destructive">
              {stats.absent} Ausentes
            </Badge>
            <Badge variant="secondary">
              {stats.late} Tardanzas
            </Badge>
            <Badge variant="warning">
              {stats.pending} Pendientes
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          {activityAttendances.map((attendance) => (
            <Card key={attendance.id} className="m-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {`${attendance.firstName?.[0] ?? ""}${attendance.lastName?.[0] ?? ""}`}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{attendance.firstName} {attendance.lastName}</p>
                  {attendance.status === AttendanceStatus.PRESENT && (
                    <Badge variant={'success'} className="ml-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Presente
                    </Badge>
                  )}
                  {attendance.status === AttendanceStatus.ABSENT && (
                    <Badge variant={'destructive'} className="ml-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Ausente
                    </Badge>
                  )}
                  {attendance.status === AttendanceStatus.PENDING && (
                    <Badge variant={'warning'} className="ml-2">
                      <MailWarningIcon className="h-3 w-3 mr-1" />
                      Pendiente
                    </Badge>
                  )}
                  {attendance.status === AttendanceStatus.LATE && (
                    <Badge variant={'secondary'} className="ml-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Tardanza
                    </Badge>
                  )}
                </div>
                {attendance.createdAt && (
                  <p className="text-xs text-muted-foreground mb-2 ml-11">
                    Inscrito: {formatDateTime(attendance.createdAt)}
                  </p>
                )}
                <div className="flex gap-1 ml-11">
                  {/* Botones para marcar asistencia */}
                  {attendance.status === AttendanceStatus.PRESENT && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAbsent(attendance.id)}
                        disabled={isAttending}
                      >
                        {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Ausente
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkLate(attendance.id)}
                        disabled={isAttending}
                      >
                        {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Tardanza
                      </Button>
                    </>
                  )}
                  {(attendance.status === AttendanceStatus.PENDING || attendance.status === AttendanceStatus.ABSENT) && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkPresent(attendance.id)}
                        disabled={isAttending}
                      >
                        {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Presente
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkLate(attendance.id)}
                        disabled={isAttending}
                      >
                        {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Tardanza
                      </Button>
                    </>
                  )}
                  {attendance.status === AttendanceStatus.LATE && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkPresent(attendance.id)}
                        disabled={isAttending}
                      >
                        {isAttending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Presente
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAbsent(attendance.id)}
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

          {activityAttendances.length === 0 && (
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
