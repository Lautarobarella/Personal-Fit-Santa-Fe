"use client"

import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import {
  ActivityStatus,
  AttendanceStatus,
  MethodType,
  MuscleGroup,
  PaymentStatus,
  UserRole,
  type ActivityType,
  type PaymentType,
  type UserDetailInfo,
  type UserType,
  type WorkShift,
} from "@/types"
import { getMuscleGroupLabel } from "@/lib/muscle-groups"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { fetchActivities, fetchTrainers } from "@/api/activities/activitiesApi"
import { fetchAllPayments } from "@/api/payments/paymentsApi"
import { fetchUsers, fetchUserDetail, fetchShiftHistory } from "@/api/clients/usersApi"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TrainerHours {
  id: number
  name: string
  totalHours: number
  daysWorked: number
  shiftsCount: number
}

export interface PaymentMethodBreakdown {
  method: string
  label: string
  count: number
  amount: number
  percentage: number
}

export interface MonthOption {
  label: string
  month: number
  year: number
}

export interface MuscleGroupStat {
  group: MuscleGroup
  label: string
  count: number
  percentage: number
}

export function useReports() {
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

        const activitiesData = await fetchActivities()
        if (!cancelled) setActivities(activitiesData)

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

  // ─── Admin computed metrics ───────────────────────────────────────────────

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

  const totalRevenue = useMemo(
    () => paidPayments.reduce((sum, p) => sum + p.amount, 0),
    [paidPayments]
  )

  const totalBilled = useMemo(
    () => monthPayments.reduce((sum, p) => sum + p.amount, 0),
    [monthPayments]
  )

  const uniqueClientsPaid = useMemo(() => {
    const clientIds = new Set<number>()
    paidPayments.forEach((p) => {
      clientIds.add(p.clientId)
      p.associatedUsers?.forEach((u) => clientIds.add(u.userId))
    })
    return clientIds.size
  }, [paidPayments])

  const activeClients = useMemo(
    () => allUsers.filter((u) => u.status === "ACTIVE" && u.role === UserRole.CLIENT).length,
    [allUsers]
  )

  const collectionRate = useMemo(() => {
    if (activeClients === 0) return 0
    return Math.round((uniqueClientsPaid / activeClients) * 100)
  }, [uniqueClientsPaid, activeClients])

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

  const averageTicket = useMemo(() => {
    if (paidPayments.length === 0) return 0
    return Math.round(totalRevenue / paidPayments.length)
  }, [totalRevenue, paidPayments])

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

  const monthActivities = useMemo(() => {
    return activities.filter((a) => {
      const d = new Date(a.date)
      return d.getMonth() === selectedMonth.month && d.getFullYear() === selectedMonth.year
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
    const active = monthActivities.filter((a) => a.status !== ActivityStatus.CANCELLED)
    if (active.length === 0) return 0
    const totalParticipants = active.reduce((sum, a) => sum + a.currentParticipants, 0)
    return Math.round((totalParticipants / active.length) * 10) / 10
  }, [monthActivities])

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

  const clientsNotPaid = useMemo(() => {
    return Math.max(0, activeClients - uniqueClientsPaid)
  }, [activeClients, uniqueClientsPaid])

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

  const clientMuscleGroups = useMemo((): MuscleGroupStat[] => {
    const map = new Map<MuscleGroup, number>()

    clientMonthActivities.forEach((a) => {
      if (a.summary?.muscleGroups) {
        a.summary.muscleGroups.forEach((mg) => {
          map.set(mg, (map.get(mg) || 0) + 1)
        })
      }
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

  const clientAvgEffort = useMemo(() => {
    const withEffort = clientMonthActivities.filter(
      (a) => a.summary && a.summary.effortLevel > 0
    )
    if (withEffort.length === 0) return 0
    const total = withEffort.reduce((s, a) => s + (a.summary?.effortLevel || 0), 0)
    return Math.round((total / withEffort.length) * 10) / 10
  }, [clientMonthActivities])

  const clientSummariesFilled = useMemo(
    () => clientMonthActivities.filter((a) => a.summary != null).length,
    [clientMonthActivities]
  )

  const clientUniqueActivities = useMemo(() => {
    const names = new Set(clientMonthActivities.map((a) => a.name))
    return names.size
  }, [clientMonthActivities])

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

  return {
    // Auth & nav
    user,
    router,
    mounted,
    isLoading,

    // Month selector
    selectedMonth,
    setSelectedMonth,
    showMonthPicker,
    setShowMonthPicker,
    monthOptions,
    currentMonthLabel,

    // Expanded sections
    expandedTrainers,
    setExpandedTrainers,
    expandedMuscles,
    setExpandedMuscles,

    // Admin metrics
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

    // Client metrics
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
  }
}
