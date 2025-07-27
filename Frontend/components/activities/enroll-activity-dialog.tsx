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
import { Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ActivityType } from "@/lib/types"

interface EnrollActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: ActivityType
  onEnroll: (activity: ActivityType) => void
}

export function EnrollActivityDialog({ open, onOpenChange, activity, onEnroll }: EnrollActivityDialogProps) {
  const [isEnrolling, setIsEnrolling] = useState(false)
  const { toast } = useToast()

  const handleEnroll = async () => {
    setIsEnrolling(true)

    try {
      
      onEnroll(activity)

      toast({
        title: "Inscripcion Exitosa",
        description: `"Se ha inscripto con exito a ${activity.name}"`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo inscribir a la actividad, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsEnrolling(false)
    }
  }

  const hasParticipants = activity.currentParticipants > 0
  const isPastActivity = new Date(activity.date) < new Date()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Inscribirse a actividad
          </AlertDialogTitle>
          <AlertDialogDescription>
            Presiona aceptar para inscribirse a la actividad "{activity.name}"
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isEnrolling}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEnroll}
            disabled={isEnrolling}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isEnrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aceptar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
