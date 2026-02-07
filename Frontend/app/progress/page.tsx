"use client"

import { fetchCurrentUserById } from "@/api/clients/usersApi"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useToast } from "@/hooks/use-toast"
import { ActivityStatus, UserRole, type UserDetailInfo } from "@/lib/types"
import { Calendar, Loader2, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function ProgressPage() {
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
          description: "No se pudo cargar tu progreso.",
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

  const completedWithSummary = useMemo(() => {
    return completedActivities.filter((activity) => !!activity.summary)
  }, [completedActivities])

  const averageEffort = useMemo(() => {
    if (completedWithSummary.length === 0) {
      return 0
    }

    const totalEffort = completedWithSummary.reduce((accumulated, activity) => {
      return accumulated + (activity.summary?.effortLevel ?? 0)
    }, 0)

    return Math.round((totalEffort / completedWithSummary.length) * 10) / 10
  }, [completedWithSummary])

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
      <MobileHeader title="Mi Progreso" showBack onBack={() => router.push("/dashboard")} />

      <main className="container-centered py-6 pb-32 space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 p-3 bg-primary/10 rounded-full w-fit">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Progreso Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-auto justify-between p-4 bg-muted/40"
              onClick={() => router.push("/progress/completed")}
            >
              <div className="flex items-center gap-3 text-left">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Clases Completadas</p>
                  <p className="text-sm text-muted-foreground">Ver listado y resumenes</p>
                </div>
              </div>
              <div className="text-2xl font-bold">{completedActivities.length}</div>
            </Button>

            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-secondary" />
                <div>
                  <p className="font-medium">Promedio de Esfuerzo</p>
                  <p className="text-sm text-muted-foreground">Segun tus resumenes cargados</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{averageEffort.toFixed(1)}/10</p>
                <p className="text-xs text-muted-foreground">{completedWithSummary.length} resumenes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
