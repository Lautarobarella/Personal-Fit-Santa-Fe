"use client"

import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Separator } from "@/components/ui/separator"
import { useReports } from "@/hooks/reports/use-reports"
import { UserRole } from "@/types"
import {
  Activity,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Dumbbell,
  DollarSign,
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
    activeClients,
    collectionRate,
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
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No tenés acceso a esta sección.</p>
              <Button className="mt-4" onClick={() => router.push("/dashboard")}>
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-safe-bottom">
        <MobileHeader title="Reportes" showBack onBack={() => router.push("/dashboard")} />
        <div className="container-centered py-6 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span className="ml-3 text-muted-foreground">Cargando reportes...</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    )
  }

  // ─── Render: Month Selector (shared) ────────────────────────────────────

  const monthSelector = (
    <Card className="shadow-professional border-0">
      <CardContent className="p-4">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setShowMonthPicker(!showMonthPicker)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Período
              </p>
              <p className="text-lg font-bold capitalize">{currentMonthLabel}</p>
            </div>
          </div>
          {showMonthPicker ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {showMonthPicker && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {monthOptions.map((opt) => (
              <button
                key={`${opt.year}-${opt.month}`}
                className={`p-3 rounded-xl text-sm font-medium capitalize transition-all ${
                  opt.month === selectedMonth.month && opt.year === selectedMonth.year
                    ? "bg-primary text-primary-foreground shadow-professional"
                    : "bg-muted/50 hover:bg-muted text-foreground"
                }`}
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
      </CardContent>
    </Card>
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

          {/* ─── Attendance Overview ────────────────────────────────────────── */}
          <Card className="shadow-professional border-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Asistencia del Mes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                  Actividades asistidas
                </p>
                <p className="text-4xl font-bold text-foreground tracking-tight">
                  {clientAttended}
                </p>
                {clientActivityChange !== null && (
                  <p
                    className={`text-sm font-medium mt-1 ${
                      clientActivityChange >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {clientActivityChange >= 0 ? "+" : ""}
                    {clientActivityChange}% vs mes anterior
                  </p>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-xl text-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{clientAttended}</p>
                  <p className="text-xs text-muted-foreground">Presentes</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl text-center">
                  <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">{clientAbsences}</p>
                  <p className="text-xs text-muted-foreground">Ausencias</p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl text-center">
                  <Clock className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{clientLateArrivals}</p>
                  <p className="text-xs text-muted-foreground">Llegadas tarde</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-center">
                  <Target className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{clientAttendanceRate}%</p>
                  <p className="text-xs text-muted-foreground">Tasa asistencia</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Training Stats ─────────────────────────────────────────────── */}
          <Card className="shadow-professional border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Entrenamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-xl text-center">
                  <Zap className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{clientBestStreak}</p>
                  <p className="text-xs text-muted-foreground">Mejor racha</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl text-center">
                  <Flame className="h-5 w-5 text-red-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{clientAvgEffort}/10</p>
                  <p className="text-xs text-muted-foreground">Esfuerzo promedio</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl text-center">
                  <BarChart3 className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{clientSummariesFilled}</p>
                  <p className="text-xs text-muted-foreground">Resúmenes cargados</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl text-center">
                  <Dumbbell className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{clientUniqueActivities}</p>
                  <p className="text-xs text-muted-foreground">Actividades distintas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Week Distribution ──────────────────────────────────────────── */}
          <Card className="shadow-professional border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Distribución Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                    <span className="text-xs font-bold">{d.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ─── Muscle Group Breakdown ─────────────────────────────────────── */}
          {clientMuscleGroups.length > 0 && (
            <Card className="shadow-professional border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  Grupos Musculares
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(expandedMuscles ? clientMuscleGroups : clientMuscleGroups.slice(0, 5)).map((mg) => (
                  <div key={mg.group} className="space-y-1">
                    <div className="flex items-center justify-between">
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
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── Client KPIs ───────────────────────────────────────────────── */}
          <Card className="shadow-professional border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Indicadores del Mes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Total inscripciones</span>
                <span className="text-sm font-bold">{clientMonthActivities.length}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Tasa de asistencia</span>
                <span className="text-sm font-bold">{clientAttendanceRate}%</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Actividades por semana (prom.)</span>
                <span className="text-sm font-bold">
                  {clientAttended > 0 ? (clientAttended / 4.3).toFixed(1) : 0}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Resúmenes completados</span>
                <span className="text-sm font-bold">
                  {clientAttended > 0
                    ? `${clientSummariesFilled}/${clientAttended} (${Math.round((clientSummariesFilled / clientAttended) * 100)}%)`
                    : "0/0"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Grupos musculares trabajados</span>
                <span className="text-sm font-bold">{clientMuscleGroups.length}</span>
              </div>
            </CardContent>
          </Card>
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

        {/* ─── Revenue Overview ───────────────────────────────────────────── */}
        <Card className="shadow-professional border-0 overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-primary opacity-20" />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Resumen Financiero
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main revenue number */}
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                Ingresos cobrados
              </p>
              <p className="text-4xl font-bold text-foreground tracking-tight">
                ${totalRevenue.toLocaleString("es-AR")}
              </p>
              {revenueChange !== null && (
                <p
                  className={`text-sm font-medium mt-1 ${
                    revenueChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {revenueChange >= 0 ? "+" : ""}
                  {revenueChange}% vs mes anterior
                </p>
              )}
            </div>

            <Separator />

            {/* Revenue detail grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-xl">
                <p className="text-xs text-muted-foreground font-medium">Cobrado</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-400">
                  ${totalRevenue.toLocaleString("es-AR")}
                </p>
                <p className="text-xs text-muted-foreground">{paidPayments.length} pagos</p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl">
                <p className="text-xs text-muted-foreground font-medium">Pendiente</p>
                <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
                  ${pendingPayments
                    .reduce((s, p) => s + p.amount, 0)
                    .toLocaleString("es-AR")}
                </p>
                <p className="text-xs text-muted-foreground">{pendingPayments.length} pagos</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl">
                <p className="text-xs text-muted-foreground font-medium">Rechazado</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-400">
                  ${rejectedPayments
                    .reduce((s, p) => s + p.amount, 0)
                    .toLocaleString("es-AR")}
                </p>
                <p className="text-xs text-muted-foreground">{rejectedPayments.length} pagos</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                <p className="text-xs text-muted-foreground font-medium">Ticket promedio</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                  ${averageTicket.toLocaleString("es-AR")}
                </p>
                <p className="text-xs text-muted-foreground">por pago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Payment Methods ────────────────────────────────────────────── */}
        {paymentMethodBreakdown.length > 0 && (
          <Card className="shadow-professional border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Métodos de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentMethodBreakdown.map((m) => (
                <div key={m.method} className="space-y-1">
                  <div className="flex items-center justify-between">
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
            </CardContent>
          </Card>
        )}

        {/* ─── Client Metrics ─────────────────────────────────────────────── */}
        <Card className="shadow-professional border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-xl text-center">
                <UserCheck className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold">{uniqueClientsPaid}</p>
                <p className="text-xs text-muted-foreground">Pagaron</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl text-center">
                <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold">{activeClients}</p>
                <p className="text-xs text-muted-foreground">Activos totales</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl text-center">
                <Target className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                <p className="text-2xl font-bold">{collectionRate}%</p>
                <p className="text-xs text-muted-foreground">Tasa de cobro</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl text-center">
                <TrendingUp className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <p className="text-2xl font-bold">{newClientsThisMonth}</p>
                <p className="text-xs text-muted-foreground">Nuevos este mes</p>
              </div>
            </div>

            {clientsNotPaid > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  ⚠️ {clientsNotPaid} cliente{clientsNotPaid !== 1 ? "s" : ""} activo
                  {clientsNotPaid !== 1 ? "s" : ""} sin pago registrado este mes
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Activity Metrics ───────────────────────────────────────────── */}
        <Card className="shadow-professional border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Actividades del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-xl text-center">
                <p className="text-2xl font-bold">{completedActivities}</p>
                <p className="text-xs text-muted-foreground">Clases realizadas</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl text-center">
                <p className="text-2xl font-bold">{cancelledActivities}</p>
                <p className="text-xs text-muted-foreground">Canceladas</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl text-center">
                <p className="text-2xl font-bold">{avgParticipantsPerClass}</p>
                <p className="text-xs text-muted-foreground">Prom. alumnos/clase</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl text-center">
                <p className="text-2xl font-bold">{avgOccupancyRate}%</p>
                <p className="text-xs text-muted-foreground">Ocupación promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Trainer Hours ──────────────────────────────────────────────── */}
        <Card className="shadow-professional border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Horas por Entrenador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Total summary */}
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
              <span className="text-sm font-semibold">Total horas del mes</span>
              <span className="text-xl font-bold">
                {Math.round(totalTrainerHours * 10) / 10} hs
              </span>
            </div>

            <Separator />

            {/* Per-trainer breakdown */}
            {trainerHoursData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay entrenadores registrados.
              </p>
            ) : (
              <>
                {(expandedTrainers ? trainerHoursData : trainerHoursData.slice(0, 3)).map(
                  (trainer) => (
                    <div
                      key={trainer.id}
                      className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{trainer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {trainer.daysWorked} días · {trainer.shiftsCount} turnos
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{trainer.totalHours} hs</p>
                        <p className="text-xs text-muted-foreground">
                          {trainer.daysWorked > 0
                            ? `${(trainer.totalHours / trainer.daysWorked).toFixed(1)} hs/día`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  )
                )}

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
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ─── Summary KPIs ───────────────────────────────────────────────── */}
        <Card className="shadow-professional border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Indicadores Clave
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Ingreso por cliente activo</span>
              <span className="text-sm font-bold">
                ${activeClients > 0 ? Math.round(totalRevenue / activeClients).toLocaleString("es-AR") : 0}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Costo por hora (horas totales)</span>
              <span className="text-sm font-bold">
                ${totalTrainerHours > 0 ? Math.round(totalRevenue / totalTrainerHours).toLocaleString("es-AR") : "—"}/hs
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Clientes por entrenador</span>
              <span className="text-sm font-bold">
                {trainers.length > 0 ? Math.round(activeClients / trainers.length) : 0}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Clases por entrenador</span>
              <span className="text-sm font-bold">
                {trainers.length > 0 ? Math.round(completedActivities / trainers.length) : 0}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Total facturado (todos los estados)</span>
              <span className="text-sm font-bold">
                ${totalBilled.toLocaleString("es-AR")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  )
}
