"use client"

import { useCompletedClasses } from "@/hooks/progress/use-completed-classes"
import { UserRole } from "@/types"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MobileHeader } from "@/components/ui/mobile-header"
import { getMuscleGroupLabels } from "@/lib/muscle-groups"
import { Calendar, Clock, Loader2 } from "lucide-react"

export default function CompletedClassesPage() {
  const {
    user,
    router,
    isLoading,
    clientDetail,
    completedActivities,
    formatDate,
    formatTime,
  } = useCompletedClasses()

  if (!user || user.role !== UserRole.CLIENT) {
    return null
  }

  if (isLoading || !clientDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Clases Completadas" showBack onBack={() => router.push("/progress")} />

      <div className="container-centered py-6 pb-safe-bottom">
        <div className="mb-3 flex items-baseline justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <h3 className="text-base font-semibold">Tus clases</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {completedActivities.length} {completedActivities.length === 1 ? "completada" : "completadas"}
          </span>
        </div>

        {completedActivities.length === 0 ? (
          <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Aún no tenés clases completadas.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:items-start lg:gap-3">
            {completedActivities.map((activity) => (
              <div
                key={`${activity.id}-${activity.date}`}
                className="space-y-3 rounded-xl border p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{activity.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Entrenador: {activity.trainerName}
                    </p>
                  </div>
                  <Badge variant="success" className="shrink-0">
                    Completada
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    <span>{formatDate(activity.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>{formatTime(activity.date)}</span>
                  </div>
                </div>

                {activity.summary ? (
                  <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Tu resumen
                      </p>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        Esfuerzo {activity.summary.effortLevel}/10
                      </Badge>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">Grupo:</span>{" "}
                      {getMuscleGroupLabels(
                        activity.summary.muscleGroups?.length
                          ? activity.summary.muscleGroups
                          : activity.summary.muscleGroup
                            ? [activity.summary.muscleGroup]
                            : [],
                      ).join(", ") || "No informado"}
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {activity.summary.trainingDescription}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="bg-transparent"
                      onClick={() => router.push(`/activities/${activity.id}/summary`)}
                    >
                      Editar resumen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-lg border border-dashed p-3">
                    <p className="text-sm text-muted-foreground">
                      No cargaste resumen para esta clase.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="bg-transparent"
                      onClick={() => router.push(`/activities/${activity.id}/summary`)}
                    >
                      Cargar resumen
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
