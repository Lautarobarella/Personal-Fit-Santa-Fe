"use client"

import { useProgress } from "@/hooks/progress/use-progress"
import { UserRole } from "@/types"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Calendar, Loader2, TrendingUp } from "lucide-react"

export default function ProgressPage() {
  const {
    user,
    router,
    isLoading,
    clientDetail,
    completedActivities,
    completedWithSummary,
    averageEffort,
  } = useProgress()

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
