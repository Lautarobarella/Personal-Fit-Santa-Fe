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
import { useToast } from "@/hooks/use-toast"
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
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date))
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const handleAction = async () => {
    setIsLoading(true)

    try {
      await onToggleEnrollment(activity)
      toast({
        title: isEnrolled ? "Desinscripción Exitosa" : "Inscripción Exitosa",
        description: isEnrolled
          ? `Te has desinscripto de "${activity.name}".`
          : `Te has inscripto a "${activity.name}".`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: isEnrolled
          ? "No se pudo desinscribir de la actividad, intente nuevamente."
          : "No se pudo inscribir a la actividad, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isEnrolled ? "Desinscribirse de actividad" : "Inscribirse a actividad"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-foreground">{activity.name}</h4>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(activity.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatTime(activity.date)} ({activity.duration} min)</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{activity.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{activity.currentParticipants}/{activity.maxParticipants} participantes</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              {isEnrolled
                ? `¿Estás seguro de que deseas desinscribirte de "${activity.name}"?`
                : `Presiona aceptar para inscribirte a "${activity.name}".`}
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
