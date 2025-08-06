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
import { Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ActivityType } from "@/lib/types"

interface DeleteActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: ActivityType
  onDelete: (activityId: number) => void
}

export function DeleteActivityDialog({ open, onOpenChange, activity, onDelete }: DeleteActivityDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await onDelete(activity.id)
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Error in delete dialog:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const hasParticipants = activity.currentParticipants > 0
  const isPastActivity = new Date(activity.date) < new Date()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Eliminar Actividad
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres eliminar la actividad "{activity.name}"?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {hasParticipants && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta actividad tiene {activity.currentParticipants} participantes inscritos. Al eliminarla, se
                cancelarán todas las inscripciones.
              </AlertDescription>
            </Alert>
          )}

          {isPastActivity && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta es una actividad pasada. Eliminarla también eliminará todos los registros de asistencia asociados.
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
