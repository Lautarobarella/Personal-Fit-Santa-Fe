"use client"

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEnrollActivityDialog } from "@/hooks/activities/use-enroll-activity-dialog"
import { Loader2, Users, Calendar, Clock, MapPin } from "lucide-react"
import { ActivityType } from "@/lib/types"

interface EnrollActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: ActivityType
  isEnrolled: boolean
  onToggleEnrollment: (activity: ActivityType) => Promise<void>
}

export function EnrollActivityDialog({
  open,
  onOpenChange,
  activity,
  isEnrolled,
  onToggleEnrollment,
}: EnrollActivityDialogProps) {
  const {
    isLoading,
    formatDate,
    formatTime,
    handleAction,
  } = useEnrollActivityDialog(activity, isEnrolled, onToggleEnrollment, onOpenChange)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            {isEnrolled ? "Desinscribirse de actividad" : "Inscribirse a actividad"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-center text-lg">{activity.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(activity.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatTime(activity.date)} ({activity.duration} min)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{activity.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{activity.currentParticipants}/{activity.maxParticipants} participantes</span>
                    </div>
                  </div>
                  
                  <div className="text-center pt-2 border-t">
                    {isEnrolled
                      ? `¿Estás seguro de que deseas desinscribirte de "${activity.name}"?`
                      : `Presiona aceptar para inscribirte a "${activity.name}".`}
                  </div>
                </CardContent>
              </Card>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAction}
            disabled={isLoading}
            className={isEnrolled ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEnrolled ? "Desinscribirse" : "Inscribirse"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
