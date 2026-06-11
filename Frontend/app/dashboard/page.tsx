"use client"

import { AttendanceActivityDialog } from "@/components/activities/attendance-activity-dialog"
import { ClientDetailsDialog } from "@/components/clients/details-client-dialog"
import { TermsAndConditionsDialog } from "@/components/dashboard/terms-and-conditions-dialog"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Separator } from "@/components/ui/separator"
import { useDashboard } from "@/hooks/dashboard/use-dashboard"
import { cn } from "@/lib/utils"
import { UserRole } from "@/types"
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CheckCircle,
  Eye,
  EyeOff,
  Timer,
} from "lucide-react"
import { useEffect, useState } from "react"

const getStatValueClass = (color: string) => {
  switch (color) {
    case "success":
      return "text-green-600 dark:text-green-400"
    case "destructive":
      return "text-red-600 dark:text-red-400"
    case "bg-orange-500":
    case "warning":
      return "text-primary"
    default:
      return "text-foreground"
  }
}

const getStatIconClass = (color: string) => {
  switch (color) {
    case "success":
      return "text-green-600/70 dark:text-green-400/70"
    case "destructive":
      return "text-red-600/70 dark:text-red-400/70"
    case "bg-orange-500":
    case "warning":
      return "text-primary/70"
    default:
      return "text-muted-foreground"
  }
}

const getAlertClasses = (type: string) => {
  switch (type) {
    case "success":
      return "border-green-500/30 bg-green-500/5"
    case "info":
      return "border-border bg-muted/40"
    default:
      return "border-primary/30 bg-primary/5"
  }
}

function DashboardContent() {
  const {
    user,
    mounted,
    isLoading,
    showRevenue,
    setShowRevenue,
    showMonthlyHours,
    setShowMonthlyHours,
    showProfileDialog,
    setShowProfileDialog,
    showTermsDialog,
    trainerAttendanceDialog,
    setTrainerAttendanceDialog,
    stats,
    quickActions,
    alerts,
    handleAcceptTerms,
    handleRejectTerms,
    handleNavigation,
    getMonthlyHours,
  } = useDashboard()

  if (!mounted) {
    return null
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background pb-safe-bottom">
        <MobileHeader title="Cargando…" />
        <div className="container-centered py-6 space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full size-8 border-b-2 border-primary"></div>
                <span className="ml-2">Cargando dashboard…</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    )
  }

  // Con cantidad impar de stats, la primera ocupa el ancho completo para que
  // la grilla quede balanceada.
  const statSpansTwo = (index: number) => stats.length % 2 === 1 && index === 0

  // DashboardContent se monta solo en el cliente (gate de `mounted` del
  // wrapper), por lo que estas fechas nunca se evalúan durante SSR.
  const currentMonthLabel = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })

  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <MobileHeader title={`Hola, ${user.firstName}`} />

      <div className="container-centered h-full py-6 space-y-6">
        {/* Bienvenida — cartel naranja del gimnasio */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-6 py-7 shadow-professional-lg dark:from-primary/90 dark:via-primary/80 dark:to-primary/60">
          <div className="relative z-10">
            <p className="text-sm font-medium text-white/80">Bienvenido de vuelta</p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              {user.firstName} {user.lastName}
            </h2>
            {/* Solo se renderiza en cliente (gate de `mounted`), la fecha no
                puede divergir entre server y browser */}
            <p className="mt-2 text-xs capitalize text-white/70" suppressHydrationWarning>
              {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="absolute -right-6 -top-6 size-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -right-10 size-24 rounded-full bg-white/5" />
        </div>

        {/* Alertas — banners planos */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={`${alert.type}-${alert.message}`}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border p-3",
                  getAlertClasses(alert.type),
                )}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  {alert.type === "warning" && (
                    <AlertTriangle className="size-4 shrink-0 text-primary" />
                  )}
                  {alert.type === "info" && (
                    <Bell className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  {alert.type === "success" && (
                    <CheckCircle className="size-4 shrink-0 text-green-600" />
                  )}
                  <span className="text-sm font-medium">{String(alert.message ?? "")}</span>
                </div>
                {alert.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-xs font-medium text-primary hover:text-primary"
                    onClick={() =>
                      alert.onClick
                        ? alert.onClick()
                        : handleNavigation(alert.route ?? "", alert.action ?? "")
                    }
                  >
                    {String(alert.action ?? "")}
                    <ArrowUpRight className="size-4 ml-1" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Estadísticas — un único panel con divisores */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <h3 className="text-base font-semibold">Tu resumen</h3>
          </div>
          <div className="overflow-hidden rounded-2xl border">
            <div className="grid grid-cols-2 gap-px bg-border">
              {stats.map((stat, index) => (
                <div
                  key={stat.title}
                  className={cn("bg-background p-4", statSpansTwo(index) && "col-span-2")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {String(stat.title ?? "")}
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <stat.icon className={cn("size-4", getStatIconClass(stat.color))} />
                      {stat.isRevenue && (
                        <button
                          type="button"
                          onClick={() => setShowRevenue(!showRevenue)}
                          className="rounded-full p-0.5 transition-colors hover:bg-muted"
                          aria-label={showRevenue ? "Ocultar ingresos" : "Mostrar ingresos"}
                        >
                          {showRevenue ? (
                            <Eye className="size-4 text-muted-foreground" />
                          ) : (
                            <EyeOff className="size-4 text-muted-foreground" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <p
                    className={cn(
                      "mt-2 font-semibold tracking-tight",
                      stat.dynamicFontSize || "text-2xl",
                      getStatValueClass(stat.color),
                    )}
                  >
                    {String(stat.value ?? "")}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {String(stat.description ?? "")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Acciones rápidas — tiles sueltos, sin card contenedora */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <h3 className="text-base font-semibold">Acciones Rápidas</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.title}
                type="button"
                disabled={action.disabled}
                onClick={() =>
                  action.onClick ? action.onClick() : handleNavigation(action.route!, action.title)
                }
                className="group flex flex-col items-center gap-2.5 rounded-xl border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                {/* Secuencia naranja/gris definida por el color de cada acción */}
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl transition-colors",
                    action.color === "bg-orange-500"
                      ? "bg-primary/10 group-hover:bg-primary/15"
                      : "bg-muted group-hover:bg-muted/80",
                  )}
                >
                  <action.icon
                    className={cn(
                      "size-5",
                      action.color === "bg-orange-500" ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                </span>
                <span className="text-center text-sm font-medium leading-tight">
                  {String(action.title ?? "")}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />

      {/* Dialog de perfil para clientes */}
      {user?.role === UserRole.CLIENT && user.id && (
        <ClientDetailsDialog
          _open={showProfileDialog}
          onOpenChange={setShowProfileDialog}
          userId={user.id}
        />
      )}

      {/* Dialog de términos y condiciones */}
      <TermsAndConditionsDialog
        open={showTermsDialog}
        onAccept={handleAcceptTerms}
        onReject={handleRejectTerms}
      />

      {/* Dialog de asistencia para entrenador */}
      {trainerAttendanceDialog.activityId && (
        <AttendanceActivityDialog
          open={trainerAttendanceDialog.open}
          onOpenChange={(open) =>
            setTrainerAttendanceDialog({
              open,
              activityId: open ? trainerAttendanceDialog.activityId : null,
            })
          }
          activityId={trainerAttendanceDialog.activityId}
        />
      )}

      {/* Dialog de horas mensuales */}
      {showMonthlyHours && (
        <Dialog open={showMonthlyHours} onOpenChange={setShowMonthlyHours}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Timer className="size-5" />
                Horas del mes - {currentMonthLabel}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              {(() => {
                const monthlyData = getMonthlyHours()
                const totalMonth = monthlyData.reduce((sum, d) => sum + d.totalHours, 0)
                const daysWithHours = monthlyData.filter((d) => d.totalHours > 0)
                return (
                  <>
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
                      <span className="text-sm font-semibold">Total del mes</span>
                      <span className="text-lg font-bold">{totalMonth.toFixed(1)} hs</span>
                    </div>
                    <Separator />
                    {daysWithHours.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No hay horas registradas este mes.
                      </p>
                    ) : (
                      daysWithHours.map((day) => {
                        const [y, m, d] = day.date.split("-").map(Number)
                        const dateObj = new Date(y, m - 1, d)
                        const dayName = dateObj.toLocaleDateString("es-ES", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })
                        return (
                          <div
                            key={day.date}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                          >
                            <span className="text-sm capitalize">{dayName}</span>
                            <span className="text-sm font-semibold">{day.totalHours.toFixed(1)} hs</span>
                          </div>
                        )
                      })
                    )}
                  </>
                )
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Componente principal que se renderiza solo en el cliente
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <DashboardContent />
}
