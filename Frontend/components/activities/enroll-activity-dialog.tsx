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
import { useEnrollActivityDialog } from "@/hooks/activities/use-enroll-activity-dialog"
import { Loader2, Users, Calendar, Clock } from "lucide-react"
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
              <div className="rounded-xl border p-4">
                <p className="text-center text-base font-semibold text-foreground">{activity.name}</p>
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>{formatDate(activity.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="size-4 text-muted-foreground" />
                    <span>{formatTime(activity.date)} ({activity.duration} min)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="size-4 text-muted-foreground" />
                    <span>{activity.currentParticipants}/{activity.maxParticipants} participantes</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm">
                {isEnrolled
                  ? `¿Estás seguro de que deseas desinscribirte de "${activity.name}"?`
                  : `Presiona aceptar para inscribirte a "${activity.name}".`}
              </p>
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
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEnrolled ? "Desinscribirse" : "Inscribirse"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
