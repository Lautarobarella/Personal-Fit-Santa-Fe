"use client"

import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useReports } from "@/hooks/reports/use-reports"
import { cn } from "@/lib/utils"
import { UserRole } from "@/types"
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Flame,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
  Zap,
} from "lucide-react"

export default function ReportsPage() {
  const {
    user,
    router,
    mounted,
    isLoading,
    selectedMonth,
    setSelectedMonth,
    showMonthPicker,
    setShowMonthPicker,
    monthOptions,
    currentMonthLabel,
    expandedTrainers,
    setExpandedTrainers,
    expandedMuscles,
    setExpandedMuscles,
    totalRevenue,
    totalBilled,
    revenueChange,
    paidPayments,
    pendingPayments,
    rejectedPayments,
    averageTicket,
    paymentMethodBreakdown,
    uniqueClientsPaid,
    activeClientsAtMonthStart,
    collectionRate,
    retentionRate,
    clientsNotPaid,
    newClientsThisMonth,
    completedActivities,
    cancelledActivities,
    avgParticipantsPerClass,
    avgOccupancyRate,
    trainerHoursData,
    totalTrainerHours,
    trainers,
    clientAttended,
    clientPresentOnTime,
    clientAbsences,
    clientLateArrivals,
    clientAttendanceRate,
    clientMuscleGroups,
    clientAvgEffort,
    clientSummariesFilled,
    clientUniqueActivities,
    clientBestStreak,
    clientWeekDistribution,
    clientActivityChange,
    clientMonthActivities,
  } = useReports()

  if (!mounted) return null

  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.CLIENT)) {
    return (
      <div className="min-h-screen bg-background pb-safe-bottom">
        <MobileHeader title="Sin acceso" showBack onBack={() => router.push("/dashboard")} />
        <div className="container-centered py-6">
          <div className="rounded-xl border p-6 text-center">
            <p className="text-sm text-muted-foreground">No tenés acceso a esta sección.</p>
            <Button className="mt-4" onClick={() => router.push("/dashboard")}>
              Volver al inicio
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-safe-bottom">
        <MobileHeader title="Reportes" showBack onBack={() => router.push("/dashboard")} />
        <div className="container-centered py-6">
          <div className="flex items-center justify-center rounded-xl border py-10">
            <div className="animate-spin rounded-full size-8 border-b-2 border-primary" />
            <span className="ml-3 text-sm text-muted-foreground">Cargando reportes…</span>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  // ─── Render: Month Selector (shared) ────────────────────────────────────

  const monthSelector = (
    <div className="rounded-xl border p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2"
        onClick={() => setShowMonthPicker(!showMonthPicker)}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Calendar className="size-5 text-primary" />
          </span>
          <div className="min-w-0 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Período
            </p>
            <p className="truncate text-lg font-semibold capitalize">{currentMonthLabel}</p>
          </div>
        </div>
        {showMonthPicker ? (
          <ChevronUp className="size-5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
        )}
      </button>

      {showMonthPicker && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {monthOptions.map((opt) => (
            <button
              type="button"
              key={`${opt.year}-${opt.month}`}
              className={cn(
                "rounded-xl p-3 text-sm font-medium capitalize transition-colors",
                opt.month === selectedMonth.month && opt.year === selectedMonth.year
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-foreground hover:bg-muted",
              )}
              onClick={() => {
                setSelectedMonth({ month: opt.month, year: opt.year })
                setShowMonthPicker(false)
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // ─── Render: CLIENT view ──────────────────────────────────────────────────

  if (user.role === UserRole.CLIENT) {
    return (
      <div className="min-h-screen bg-background pb-safe-bottom">
        <MobileHeader
          title="Mi Resumen"
          showBack
          onBack={() => router.push("/dashboard")}
        />

        <div className="container-centered py-6 space-y-6">
          {monthSelector}

          {/* ─── Asistencia ─────────────────────────────────────────────────── */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h3 className="text-base font-semibold">Asistencia del mes</h3>
            </div>
            <div className="overflow-hidden rounded-2xl border">
              <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
                <div className="col-span-2 bg-background p-4 text-center lg:col-span-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Actividades asistidas
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{clientAttended}</p>
                  {clientActivityChange !== null && (
                    <p
                      className={cn(
                        "mt-1 text-sm font-medium",
                        clientActivityChange >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {clientActivityChange >= 0 ? "+" : ""}
                      {clientActivityChange}% vs mes anterior
                    </p>
                  )}
                </div>

                <div className="bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Presentes
                    </p>
                    <CheckCircle className="size-4 shrink-0 text-green-600/70 dark:text-green-400/70" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-green-600 dark:text-green-400">
                    {clientPresentOnTime}
                  </p>
                </div>
                <div className="bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Ausencias
                    </p>
                    <XCircle className="size-4 shrink-0 text-red-600/70 dark:text-red-400/70" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-red-600 dark:text-red-400">
                    {clientAbsences}
                  </p>
                </div>
                <div className="bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Llegadas tarde
                    </p>
                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{clientLateArrivals}</p>
                </div>
                <div className="bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Tasa asistencia
                    </p>
                    <Target className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {clientAttendanceRate}%
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Entrenamiento ──────────────────────────────────────────────── */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
              <h3 className="text-base font-semibold">Entrenamiento</h3>
            </div>
            <div className="overflow-hidden rounded-2xl border">
              <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
                <div className="bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Mejor racha
                    </p>
                    <Zap className="size-4 shrink-0 text-primary/70" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-primary">
                    {clientBestStreak}
                  </p>
                </div>
                <div className="bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Esfuerzo promedio
                    </p>
                    <Flame className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{clientAvgEffort}/10</p>
                </div>
                <div className="bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Resúmenes cargados
                    </p>
                    <BarChart3 className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {clientSummariesFilled}
                  </p>
                </div>
                <div className="bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Actividades distintas
                    </p>
                    <Dumbbell className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {clientUniqueActivities}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Distribución semanal ───────────────────────────────────────── */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h3 className="text-base font-semibold">Distribución semanal</h3>
            </div>
            <div className="rounded-xl border p-4">
              <div className="flex items-end justify-between gap-1 h-32">
                {clientWeekDistribution.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end h-20">
                      <div
                        className="w-full bg-primary rounded-t-md transition-all duration-500 min-h-[4px]"
                        style={{ height: `${Math.max(d.percentage, 5)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{d.day}</span>
                    <span className="text-xs font-semibold">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── Grupos musculares ──────────────────────────────────────────── */}
          {clientMuscleGroups.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
                <h3 className="text-base font-semibold">Grupos musculares</h3>
              </div>
              <div className="space-y-3 rounded-xl border p-4">
                {(expandedMuscles ? clientMuscleGroups : clientMuscleGroups.slice(0, 5)).map((mg) => (
                  <div key={mg.group} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{mg.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {mg.count} {mg.count === 1 ? "vez" : "veces"} · {mg.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-500"
                        style={{ width: `${mg.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}

                {clientMuscleGroups.length > 5 && (
                  <Button
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => setExpandedMuscles(!expandedMuscles)}
                  >
                    {expandedMuscles
                      ? "Ver menos"
                      : `Ver todos (${clientMuscleGroups.length})`}
                    {expandedMuscles ? (
                      <ChevronUp className="size-4 ml-1" />
                    ) : (
                      <ChevronDown className="size-4 ml-1" />
                    )}
                  </Button>
                )}
              </div>
            </section>
          )}

          {/* ─── Indicadores del mes ────────────────────────────────────────── */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h3 className="text-base font-semibold">Indicadores del mes</h3>
            </div>
            <div className="rounded-xl border px-4 py-1">
              <dl className="divide-y">
                <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Total inscripciones</dt>
                  <dd className="font-semibold">{clientMonthActivities.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Tasa de asistencia</dt>
                  <dd className="font-semibold">{clientAttendanceRate}%</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Actividades por semana (prom.)</dt>
                  <dd className="font-semibold">
                    {clientAttended > 0 ? (clientAttended / 4.3).toFixed(1) : 0}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Resúmenes completados</dt>
                  <dd className="font-semibold">
                    {clientAttended > 0
                      ? `${clientSummariesFilled}/${clientAttended} (${Math.round((clientSummariesFilled / clientAttended) * 100)}%)`
                      : "0/0"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Grupos musculares trabajados</dt>
                  <dd className="font-semibold">{clientMuscleGroups.length}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>

        <BottomNav />
      </div>
    )
  }

  // ─── Render: ADMIN view ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <MobileHeader
        title="Reportes"
        showBack
        onBack={() => router.push("/dashboard")}
      />

      <div className="container-centered py-6 space-y-6">
        {monthSelector}

        {/* ─── Resumen financiero ───────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <h3 className="text-base font-semibold">Resumen financiero</h3>
          </div>
          <div className="overflow-hidden rounded-2xl border">
            <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
              <div className="col-span-2 bg-background p-4 text-center lg:col-span-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ingresos cobrados
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  ${totalRevenue.toLocaleString("es-AR")}
                </p>
                {revenueChange !== null && (
                  <p
                    className={cn(
                      "mt-1 text-sm font-medium",
                      revenueChange >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {revenueChange >= 0 ? "+" : ""}
                    {revenueChange}% vs mes anterior
                  </p>
                )}
              </div>

              <div className="bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Cobrado
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-green-600 dark:text-green-400">
                  ${totalRevenue.toLocaleString("es-AR")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{paidPayments.length} pagos</p>
              </div>
              <div className="bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Pendiente
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-primary">
                  ${pendingPayments
                    .reduce((s, p) => s + p.amount, 0)
                    .toLocaleString("es-AR")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{pendingPayments.length} pagos</p>
              </div>
              <div className="bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Rechazado
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-red-600 dark:text-red-400">
                  ${rejectedPayments
                    .reduce((s, p) => s + p.amount, 0)
                    .toLocaleString("es-AR")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{rejectedPayments.length} pagos</p>
              </div>
              <div className="bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ticket promedio
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  ${averageTicket.toLocaleString("es-AR")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">por pago</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Métodos de pago ──────────────────────────────────────────────── */}
        {paymentMethodBreakdown.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
              <h3 className="text-base font-semibold">Métodos de pago</h3>
            </div>
            <div className="space-y-3 rounded-xl border p-4">
              {paymentMethodBreakdown.map((m) => (
                <div key={m.method} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{m.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {m.count} pagos · ${m.amount.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all duration-500"
                      style={{ width: `${m.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Clientes ─────────────────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <h3 className="text-base font-semibold">Clientes</h3>
          </div>
          <div className="space-y-2">
            <div className="overflow-hidden rounded-2xl border">
              <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
                <div className="bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Pagaron
                    </p>
                    <UserCheck className="size-4 shrink-0 text-green-600/70 dark:text-green-400/70" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-green-600 dark:text-green-400">
                    {uniqueClientsPaid}
                  </p>
                </div>
                <div className="bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Activos al inicio del mes
                    </p>
                    <Users className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {activeClientsAtMonthStart}
                  </p>
                </div>
                <div className="bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Tasa de cobro
                    </p>
                    <Target className="size-4 shrink-0 text-primary/70" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-primary">
                    {collectionRate}%
                  </p>
                </div>
                <div className="bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Nuevos este mes
                    </p>
                    <TrendingUp className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {newClientsThisMonth}
                  </p>
                </div>
              </div>
            </div>

            {clientsNotPaid > 0 && (
              <div className="flex items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3">
                <AlertTriangle className="size-4 shrink-0 text-primary" />
                <p className="text-sm font-medium">
                  {clientsNotPaid} cliente{clientsNotPaid !== 1 ? "s" : ""} activo
                  {clientsNotPaid !== 1 ? "s" : ""} el mes anterior todavía sin pago este mes
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ─── Actividades del mes ──────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
            <h3 className="text-base font-semibold">Actividades del mes</h3>
          </div>
          <div className="overflow-hidden rounded-2xl border">
            <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
              <div className="bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Clases realizadas
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{completedActivities}</p>
              </div>
              <div className="bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Canceladas
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{cancelledActivities}</p>
              </div>
              <div className="bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Prom. alumnos/clase
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {avgParticipantsPerClass}
                </p>
              </div>
              <div className="bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ocupación promedio
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{avgOccupancyRate}%</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Horas por entrenador ─────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <h3 className="text-base font-semibold">Horas por entrenador</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border p-4">
              <span className="text-sm font-medium">Total horas del mes</span>
              <span className="text-2xl font-semibold tracking-tight text-primary">
                {Math.round(totalTrainerHours * 10) / 10} hs
              </span>
            </div>

            {trainerHoursData.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                No hay entrenadores registrados.
              </div>
            ) : (
              <>
                <div className="rounded-xl border px-4">
                  <div className="divide-y">
                    {(expandedTrainers ? trainerHoursData : trainerHoursData.slice(0, 3)).map(
                      (trainer) => (
                        <div
                          key={trainer.id}
                          className="flex items-center justify-between gap-3 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{trainer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {trainer.daysWorked} días · {trainer.classesCount} clases
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-lg font-semibold">{trainer.totalHours} hs</p>
                            <p className="text-xs text-muted-foreground">
                              {trainer.daysWorked > 0
                                ? `${(trainer.totalHours / trainer.daysWorked).toFixed(1)} hs/día`
                                : "—"}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {trainerHoursData.length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => setExpandedTrainers(!expandedTrainers)}
                  >
                    {expandedTrainers
                      ? "Ver menos"
                      : `Ver todos (${trainerHoursData.length})`}
                    {expandedTrainers ? (
                      <ChevronUp className="size-4 ml-1" />
                    ) : (
                      <ChevronDown className="size-4 ml-1" />
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </section>

        {/* ─── Indicadores clave ────────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
            <h3 className="text-base font-semibold">Indicadores clave</h3>
          </div>
          <div className="rounded-xl border px-4 py-1">
            <dl className="divide-y">
              <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <dt className="text-muted-foreground">Ingreso promedio por cliente</dt>
                <dd className="font-semibold">
                  ${uniqueClientsPaid > 0 ? Math.round(totalRevenue / uniqueClientsPaid).toLocaleString("es-AR") : 0}
                </dd>
              </div>
              {retentionRate !== null && (
                <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Retención de clientes</dt>
                  <dd className="font-semibold">{retentionRate}%</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <dt className="text-muted-foreground">Ingreso por hora de clase</dt>
                <dd className="font-semibold">
                  {totalTrainerHours > 0
                    ? `$${Math.round(totalRevenue / totalTrainerHours).toLocaleString("es-AR")}/hs`
                    : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <dt className="text-muted-foreground">Clientes por entrenador</dt>
                <dd className="font-semibold">
                  {trainers.length > 0 ? Math.round(uniqueClientsPaid / trainers.length) : 0}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <dt className="text-muted-foreground">Clases por entrenador</dt>
                <dd className="font-semibold">
                  {trainers.length > 0 ? Math.round(completedActivities / trainers.length) : 0}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <dt className="text-muted-foreground">Total facturado (todos los estados)</dt>
                <dd className="font-semibold">
                  ${totalBilled.toLocaleString("es-AR")}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  )
}
