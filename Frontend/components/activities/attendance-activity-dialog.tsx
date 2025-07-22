"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Mail, Phone } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Calendar } from "../ui/calendar"
import { mockUsers } from "@/mocks/mockUsers"
import { ActivityType } from "@/lib/types"

interface AttendanceActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: ActivityType
  onAttendance: (activityId: string) => void
}

export function AttendanceActivityDialog({ open, onOpenChange, activity, onAttendance }: AttendanceActivityDialogProps) {
  const [isAttendanceing, setIsAttending] = useState(false)
  const [users] = useState(mockUsers)
  const handleAttendance = async () => {
    setIsAttending(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onAttendance(activity.id)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Asistencia de la actividad: "{activity.name}"
          </AlertDialogTitle>
          <AlertDialogDescription>
            A continuación se muestra la lista de participantes inscriptos:
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Lista de inscriptos falta filtrar por id segun cada actividad*/}
        <div className="space-y-3 mb-4">
          {activity.participants && activity.participants.length > 0 ? (
            users.map((client) => (
              <Card key={client.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {client.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{client.name}</h3>
                      </div>
                      {/* Aca la idea es mostrar a la hora q  */}
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {client.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No hay inscriptos aún.</div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isAttendanceing}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAttendance}
            disabled={isAttendanceing}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isAttendanceing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aceptar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
