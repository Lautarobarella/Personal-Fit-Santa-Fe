"use client"

import { useProgress } from "@/hooks/progress/use-progress"
import { UserRole } from "@/types"
import { BottomNav } from "@/components/ui/bottom-nav"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Calendar, ChevronRight, Loader2, TrendingUp } from "lucide-react"

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
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Mi Progreso" showBack onBack={() => router.push("/dashboard")} />

      <main className="container-centered py-6 pb-safe-bottom space-y-6">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <h3 className="text-base font-semibold">Progreso personal</h3>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => router.push("/progress/completed")}
              className="flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Calendar className="size-5 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium">Clases completadas</p>
                  <p className="text-sm text-muted-foreground">Ver listado y resúmenes</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-2xl font-semibold tracking-tight">
                  {completedActivities.length}
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </button>

            <div className="flex items-center justify-between gap-3 rounded-xl border p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <TrendingUp className="size-5 text-muted-foreground" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium">Promedio de esfuerzo</p>
                  <p className="text-sm text-muted-foreground">Según tus resúmenes cargados</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl font-semibold tracking-tight">
                  {averageEffort.toFixed(1)}/10
                </p>
                <p className="text-xs text-muted-foreground">
                  {completedWithSummary.length} resúmenes
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
