"use client"

import { fetchCurrentUserById } from "@/api/clients/usersApi"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useToast } from "@/hooks/use-toast"
import { getMuscleGroupLabels } from "@/lib/muscle-groups"
import { ActivityStatus, UserRole, type UserDetailInfo } from "@/lib/types"
import { Calendar, Clock, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const formatDate = (date: Date | string | null) => {
  if (!date) {
    return "N/A"
  }
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

const formatTime = (date: Date | string | null) => {
  if (!date) {
    return "--:--"
  }
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export default function CompletedClassesPage() {
  const { user } = useRequireAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [clientDetail, setClientDetail] = useState<UserDetailInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      return
    }

    if (user.role !== UserRole.CLIENT) {
      router.push("/dashboard")
      return
    }

    const loadDetail = async () => {
      setIsLoading(true)
      try {
        const detail = await fetchCurrentUserById(user.id)
        setClientDetail(detail)
      } catch {
        toast({
          title: "Error",
          description: "No se pudieron cargar tus clases completadas.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDetail()
  }, [router, toast, user])

  const completedActivities = useMemo(() => {
    if (!clientDetail) {
      return []
    }

    return clientDetail.listActivity
      .filter((activity) => activity.activityStatus === ActivityStatus.COMPLETED)
      .sort((first, second) => {
        const firstTime = first.date ? new Date(first.date).getTime() : 0
        const secondTime = second.date ? new Date(second.date).getTime() : 0
        return secondTime - firstTime
      })
  }, [clientDetail])

  if (!user || user.role !== UserRole.CLIENT) {
    return null
  }

  if (isLoading || !clientDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Clases Completadas" showBack onBack={() => router.push("/progress")} />

      <div className="container-centered py-6 pb-32 space-y-4">
        {completedActivities.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Aun no tenes clases completadas.
            </CardContent>
          </Card>
        )}

        {completedActivities.map((activity) => (
          <Card key={`${activity.id}-${activity.date}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{activity.name}</p>
                  <p className="text-sm text-muted-foreground">Entrenador: {activity.trainerName}</p>
                </div>
                <Badge variant="success">Completada</Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(activity.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(activity.date)}</span>
                </div>
              </div>

              {activity.summary ? (
                <div className="rounded-md border bg-muted/40 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tu resumen</p>
                    <Badge variant="outline" className="text-xs">
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
                <div className="rounded-md border border-dashed p-3 space-y-2">
                  <p className="text-sm text-muted-foreground">No cargaste resumen para esta clase.</p>
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
            </CardContent>
          </Card>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
