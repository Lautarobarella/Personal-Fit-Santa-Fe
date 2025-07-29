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
import { Loader2 } from "lucide-react"
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

  const handleAction = async () => {
    setIsLoading(true)

    try {
      onToggleEnrollment(activity)
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isEnrolled ? "Desinscribirse de actividad" : "Inscribirse a actividad"}
          </AlertDialogTitle>
          <AlertDialogDescription className="flex">
            {isEnrolled
              ? `¿Estás seguro de que deseas desinscribirte de "${activity.name}"?`
              : `Presiona aceptar para inscribirte a "${activity.name}".`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAction}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aceptar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
