"use client"

import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import {
  ActivityStatus,
  AttendanceStatus,
  MethodType,
  MuscleGroup,
  PaymentStatus,
  UserRole,
  type ActivitySummaryType,
  type ActivityType,
  type PaymentType,
  type UserDetailInfo,
  type UserType,
  type WorkShift,
} from "@/lib/types"
import { getMuscleGroupLabel } from "@/lib/muscle-groups"
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
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

// API imports
import { fetchActivities, fetchTrainers } from "@/api/activities/activitiesApi"
import { fetchAllPayments } from "@/api/payments/paymentsApi"
import { fetchUsers, fetchUserDetail, fetchShiftHistory } from "@/api/clients/usersApi"

// ─── Types ──────────────────────────────────────────────────────────────────

interface TrainerHours {
  id: number
  name: string
  totalHours: number
  daysWorked: number
  shiftsCount: number
}

interface PaymentMethodBreakdown {
  method: string
  label: string
  count: number
  amount: number
  percentage: number
}

interface MonthOption {
  label: string
  month: number
  year: number
}

interface MuscleGroupStat {
  group: MuscleGroup
  label: string
  count: number
  percentage: number
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { user } = useAuth()
  const router = useRouter()
  useRequireAuth()

  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // ─── Admin data ─────────────────────────────────────────────────────────
  const [payments, setPayments] = useState<PaymentType[]>([])
  const [allUsers, setAllUsers] = useState<UserType[]>([])
  const [activities, setActivities] = useState<ActivityType[]>([])
  const [trainers, setTrainers] = useState<UserType[]>([])
  const [trainerShifts, setTrainerShifts] = useState<Map<number, WorkShift[]>>(new Map())

  // ─── Client data ────────────────────────────────────────────────────────
  const [clientDetail, setClientDetail] = useState<UserDetailInfo | null>(null)

  // ─── Month selector ─────────────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return { month: now.getMonth(), year: now.getFullYear() }
  })
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  // Expanded sections
  const [expandedTrainers, setExpandedTrainers] = useState(false)
  const [expandedMuscles, setExpandedMuscles] = useState(false)

  // Generate month options (last 12 months)
  const monthOptions: MonthOption[] = useMemo(() => {
    const options: MonthOption[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      options.push({
        label: d.toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
        month: d.getMonth(),
        year: d.getFullYear(),
      })
    }
    return options
  }, [])

  const currentMonthLabel = useMemo(() => {
    const d = new Date(selectedMonth.year, selectedMonth.month, 1)
    return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
  }, [selectedMonth])

  // ─── Data loading ─────────────────────────────────────────────────────────

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !user || user.role !== UserRole.ADMIN) return

    let cancelled = false

    const loadData = async () => {
      setIsLoading(true)
      try {
        const [paymentsData, usersData, trainersData] = await Promise.all([
          fetchAllPayments(),
          fetchUsers(),
          fetchTrainers(),
        ])

        if (cancelled) return

        setPayments(paymentsData)
        setAllUsers(usersData)
        setTrainers(trainersData)

        // Load activities (current week scope from API, but we have all we need)
        const activitiesData = await fetchActivities()
        if (!cancelled) setActivities(activitiesData)

        // Load shift history for each trainer
        const shiftsMap = new Map<number, WorkShift[]>()
        const trainerIds = trainersData
          .filter((t: UserType) => t.role === UserRole.TRAINER)
          .map((t: UserType) => t.id)

        const shiftPromises = trainerIds.map(async (id: number) => {
          try {
            const history = await fetchShiftHistory(id)
            return { id, history }
          } catch {
            return { id, history: [] }
          }
        })

        const shiftResults = await Promise.all(shiftPromises)
        if (!cancelled) {
          shiftResults.forEach(({ id, history }) => shiftsMap.set(id, history))
          setTrainerShifts(shiftsMap)
        }
      } catch (error) {
        console.error("Error loading report data:", error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [mounted, user])

  // ─── Client data loading ──────────────────────────────────────────────────

  useEffect(() => {
    if (!mounted || !user || user.role !== UserRole.CLIENT) return

    let cancelled = false

    const loadClientData = async () => {
      setIsLoading(true)
      try {
        const detail = await fetchUserDetail(user.id)
        if (!cancelled) setClientDetail(detail)
      } catch (error) {
        console.error("Error loading client report data:", error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadClientData()
    return () => { cancelled = true }
  }, [mounted, user])

  // ─── Computed metrics ─────────────────────────────────────────────────────

  // Filter payments by selected month
  const monthPayments = useMemo(() => {
    return payments.filter((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : null
      return d && d.getMonth() === selectedMonth.month && d.getFullYear() === selectedMonth.year
    })
  }, [payments, selectedMonth])

  const paidPayments = useMemo(
    () => monthPayments.filter((p) => p.status === PaymentStatus.PAID),
    [monthPayments]
  )

  const pendingPayments = useMemo(
    () => monthPayments.filter((p) => p.status === PaymentStatus.PENDING),
    [monthPayments]
  )

  const rejectedPayments = useMemo(
    () => monthPayments.filter((p) => p.status === PaymentStatus.REJECTED),
    [monthPayments]
  )

  // Total revenue (PAID only)
  const totalRevenue = useMemo(
    () => paidPayments.reduce((sum, p) => sum + p.amount, 0),
    [paidPayments]
  )

  // Total billed (all payments including pending)
  const totalBilled = useMemo(
    () => monthPayments.reduce((sum, p) => sum + p.amount, 0),
    [monthPayments]
  )

  // Unique clients who paid
  const uniqueClientsPaid = useMemo(() => {
    const clientIds = new Set<number>()
    paidPayments.forEach((p) => {
      clientIds.add(p.clientId)
      // Also count associated users in multi-payments
      p.associatedUsers?.forEach((u) => clientIds.add(u.userId))
    })
    return clientIds.size
  }, [paidPayments])

  // Total active clients
  const activeClients = useMemo(
    () => allUsers.filter((u) => u.status === "ACTIVE" && u.role === UserRole.CLIENT).length,
    [allUsers]
  )

  // Collection rate
  const collectionRate = useMemo(() => {
    if (activeClients === 0) return 0
    return Math.round((uniqueClientsPaid / activeClients) * 100)
  }, [uniqueClientsPaid, activeClients])

  // Payment method breakdown
  const paymentMethodBreakdown = useMemo((): PaymentMethodBreakdown[] => {
    const methodLabels: Record<string, string> = {
      [MethodType.CASH]: "Efectivo",
      [MethodType.CARD]: "Tarjeta",
      [MethodType.TRANSFER]: "Transferencia",
      [MethodType.MERCADOPAGO]: "MercadoPago",
    }

    const methods = Object.values(MethodType)
    const total = paidPayments.length || 1

    return methods
      .map((method) => {
        const filtered = paidPayments.filter((p) => p.method === method)
        return {
          method,
          label: methodLabels[method] || method,
          count: filtered.length,
          amount: filtered.reduce((sum, p) => sum + p.amount, 0),
          percentage: Math.round((filtered.length / total) * 100),
        }
      })
      .filter((m) => m.count > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [paidPayments])

  // Average ticket
  const averageTicket = useMemo(() => {
    if (paidPayments.length === 0) return 0
    return Math.round(totalRevenue / paidPayments.length)
  }, [totalRevenue, paidPayments])

  // Trainer hours for selected month
  const trainerHoursData = useMemo((): TrainerHours[] => {
    const result: TrainerHours[] = []

    trainers.forEach((trainer) => {
      const shifts = trainerShifts.get(trainer.id) || []
      const monthShifts = shifts.filter((s) => {
        const d = new Date(s.startTime)
        return (
          d.getMonth() === selectedMonth.month &&
          d.getFullYear() === selectedMonth.year &&
          (s.status === "COMPLETED" || s.status === "AUTO_CLOSED")
        )
      })

      const totalHours = monthShifts.reduce((sum, s) => sum + (s.totalHours || 0), 0)
      const daysWorked = new Set(
        monthShifts.map((s) => new Date(s.startTime).toDateString())
      ).size

      result.push({
        id: trainer.id,
        name: `${trainer.firstName} ${trainer.lastName}`,
        totalHours: Math.round(totalHours * 10) / 10,
        daysWorked,
        shiftsCount: monthShifts.length,
      })
    })

    return result.sort((a, b) => b.totalHours - a.totalHours)
  }, [trainers, trainerShifts, selectedMonth])

  const totalTrainerHours = useMemo(
    () => trainerHoursData.reduce((sum, t) => sum + t.totalHours, 0),
    [trainerHoursData]
  )

  // Month activities
  const monthActivities = useMemo(() => {
    return activities.filter((a) => {
      const d = new Date(a.date)
      return (
        d.getMonth() === selectedMonth.month &&
        d.getFullYear() === selectedMonth.year
      )
    })
  }, [activities, selectedMonth])

  const completedActivities = useMemo(
    () => monthActivities.filter((a) => a.status === ActivityStatus.ACTIVE || a.status === ActivityStatus.COMPLETED).length,
    [monthActivities]
  )

  const cancelledActivities = useMemo(
    () => monthActivities.filter((a) => a.status === ActivityStatus.CANCELLED).length,
    [monthActivities]
  )

  const avgParticipantsPerClass = useMemo(() => {
    const active = monthActivities.filter(
      (a) => a.status !== ActivityStatus.CANCELLED
    )
    if (active.length === 0) return 0
    const totalParticipants = active.reduce((sum, a) => sum + a.currentParticipants, 0)
    return Math.round((totalParticipants / active.length) * 10) / 10
  }, [monthActivities])

  // Occupancy rate (currentParticipants / maxParticipants)
  const avgOccupancyRate = useMemo(() => {
    const active = monthActivities.filter(
      (a) => a.status !== ActivityStatus.CANCELLED && a.maxParticipants > 0
    )
    if (active.length === 0) return 0
    const totalRate = active.reduce(
      (sum, a) => sum + (a.currentParticipants / a.maxParticipants) * 100,
      0
    )
    return Math.round(totalRate / active.length)
  }, [monthActivities])

  // Clients who haven't paid (active clients - unique clients who paid)
  const clientsNotPaid = useMemo(() => {
    return Math.max(0, activeClients - uniqueClientsPaid)
  }, [activeClients, uniqueClientsPaid])

  // New clients this month (joinDate in selected month)
  const newClientsThisMonth = useMemo(() => {
    return allUsers.filter((u) => {
      if (u.role !== UserRole.CLIENT) return false
      const joinDate = u.joinDate ? new Date(u.joinDate) : null
      return (
        joinDate &&
        joinDate.getMonth() === selectedMonth.month &&
        joinDate.getFullYear() === selectedMonth.year
      )
    }).length
  }, [allUsers, selectedMonth])

  // Previous month revenue for comparison
  const prevMonthRevenue = useMemo(() => {
    const prevMonth = selectedMonth.month === 0 ? 11 : selectedMonth.month - 1
    const prevYear = selectedMonth.month === 0 ? selectedMonth.year - 1 : selectedMonth.year

    const prevPayments = payments.filter((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : null
      return (
        d &&
        d.getMonth() === prevMonth &&
        d.getFullYear() === prevYear &&
        p.status === PaymentStatus.PAID
      )
    })

    return prevPayments.reduce((sum, p) => sum + p.amount, 0)
  }, [payments, selectedMonth])

  const revenueChange = useMemo(() => {
    if (prevMonthRevenue === 0) return null
    return Math.round(((totalRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
  }, [totalRevenue, prevMonthRevenue])

  // ─── Client computed metrics ──────────────────────────────────────────────

  const clientMonthActivities = useMemo(() => {
    if (!clientDetail) return []
    return clientDetail.listActivity.filter((a) => {
      const d = a.date ? new Date(a.date) : null
      return d && d.getMonth() === selectedMonth.month && d.getFullYear() === selectedMonth.year
    })
  }, [clientDetail, selectedMonth])

  const clientAttended = useMemo(
    () => clientMonthActivities.filter(
      (a) => a.clientStatus === AttendanceStatus.PRESENT || a.clientStatus === AttendanceStatus.LATE
    ).length,
    [clientMonthActivities]
  )

  const clientAbsences = useMemo(
    () => clientMonthActivities.filter((a) => a.clientStatus === AttendanceStatus.ABSENT).length,
    [clientMonthActivities]
  )

  const clientLateArrivals = useMemo(
    () => clientMonthActivities.filter((a) => a.clientStatus === AttendanceStatus.LATE).length,
    [clientMonthActivities]
  )

  const clientAttendanceRate = useMemo(() => {
    const total = clientMonthActivities.filter(
      (a) => a.clientStatus !== AttendanceStatus.PENDING
    ).length
    if (total === 0) return 0
    return Math.round((clientAttended / total) * 100)
  }, [clientMonthActivities, clientAttended])

  // Muscle group stats
  const clientMuscleGroups = useMemo((): MuscleGroupStat[] => {
    const map = new Map<MuscleGroup, number>()

    clientMonthActivities.forEach((a) => {
      if (a.summary?.muscleGroups) {
        a.summary.muscleGroups.forEach((mg) => {
          map.set(mg, (map.get(mg) || 0) + 1)
        })
      }
      // fallback single muscleGroup
      if (a.summary?.muscleGroup && !a.summary.muscleGroups?.length) {
        map.set(a.summary.muscleGroup, (map.get(a.summary.muscleGroup) || 0) + 1)
      }
    })

    const total = Array.from(map.values()).reduce((s, v) => s + v, 0) || 1
    return Array.from(map.entries())
      .map(([group, count]) => ({
        group,
        label: getMuscleGroupLabel(group),
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
  }, [clientMonthActivities])

  // Average effort level
  const clientAvgEffort = useMemo(() => {
    const withEffort = clientMonthActivities.filter(
      (a) => a.summary && a.summary.effortLevel > 0
    )
    if (withEffort.length === 0) return 0
    const total = withEffort.reduce((s, a) => s + (a.summary?.effortLevel || 0), 0)
    return Math.round((total / withEffort.length) * 10) / 10
  }, [clientMonthActivities])

  // How many activities have a filled summary
  const clientSummariesFilled = useMemo(
    () => clientMonthActivities.filter((a) => a.summary != null).length,
    [clientMonthActivities]
  )

  // Unique activity names
  const clientUniqueActivities = useMemo(() => {
    const names = new Set(clientMonthActivities.map((a) => a.name))
    return names.size
  }, [clientMonthActivities])

  // Best attendance streak
  const clientBestStreak = useMemo(() => {
    if (!clientDetail) return 0
    const sorted = [...clientDetail.listActivity]
      .filter((a) => a.date)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())

    let best = 0
    let current = 0
    sorted.forEach((a) => {
      if (a.clientStatus === AttendanceStatus.PRESENT || a.clientStatus === AttendanceStatus.LATE) {
        current++
        if (current > best) best = current
      } else if (a.clientStatus === AttendanceStatus.ABSENT) {
        current = 0
      }
    })
    return best
  }, [clientDetail])

  // Week day distribution
  const clientWeekDistribution = useMemo(() => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    const counts = new Array(7).fill(0)

    clientMonthActivities.forEach((a) => {
      if (
        a.clientStatus === AttendanceStatus.PRESENT ||
        a.clientStatus === AttendanceStatus.LATE
      ) {
        const d = a.date ? new Date(a.date) : null
        if (d) counts[d.getDay()]++
      }
    })

    const max = Math.max(...counts, 1)
    return days.map((day, i) => ({ day, count: counts[i], percentage: Math.round((counts[i] / max) * 100) }))
  }, [clientMonthActivities])

  // Previous month client comparison
  const prevMonthClientAttended = useMemo(() => {
    if (!clientDetail) return 0
    const prevMonth = selectedMonth.month === 0 ? 11 : selectedMonth.month - 1
    const prevYear = selectedMonth.month === 0 ? selectedMonth.year - 1 : selectedMonth.year

    return clientDetail.listActivity.filter((a) => {
      const d = a.date ? new Date(a.date) : null
      return (
        d &&
        d.getMonth() === prevMonth &&
        d.getFullYear() === prevYear &&
        (a.clientStatus === AttendanceStatus.PRESENT || a.clientStatus === AttendanceStatus.LATE)
      )
    }).length
  }, [clientDetail, selectedMonth])

  const clientActivityChange = useMemo(() => {
    if (prevMonthClientAttended === 0) return null
    return Math.round(((clientAttended - prevMonthClientAttended) / prevMonthClientAttended) * 100)
  }, [clientAttended, prevMonthClientAttended])

  // ─── Guards ───────────────────────────────────────────────────────────────

  if (!mounted) return null

  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.CLIENT)) {
    return (
      <div className="min-h-screen bg-background pb-32">
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
      <div className="min-h-screen bg-background pb-32">
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
      <div className="min-h-screen bg-background pb-32">
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
    <div className="min-h-screen bg-background pb-32">
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
