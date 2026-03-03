import { useActivityContext } from "@/contexts/activity-provider"
import { useAuth } from "@/contexts/auth-provider"
import { usePaymentContext } from "@/contexts/payment-provider"
import { fetchActivityDetail } from "@/api/activities/activitiesApi"
import { useClients } from "@/hooks/clients/use-client"
import { useClientStats } from "@/hooks/clients/use-client-stats"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useToast } from "@/hooks/use-toast"
import { useTrainer } from "@/hooks/clients/use-trainer"
import { hasAcceptedTerms } from "@/lib/terms-and-conditions-storage"
import { ActivityStatus, AttendanceStatus, UserRole } from "@/types"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
  Activity,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  LogIn,
  LogOut,
  Target,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react"

export interface DashboardStat {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  dynamicFontSize?: string
  color: string
  isRevenue?: boolean
}

export interface QuickAction {
  title: string
  route?: string
  onClick?: () => void
  icon: React.ComponentType<{ className?: string }>
  color: string
  disabled?: boolean
}

export interface DashboardAlert {
  type: string
  message: string
  action?: string
  route?: string
  onClick?: () => void
}

export function useDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useRequireAuth()

  const [dashboardStats, setDashboardStats] = useState({
    monthlyRevenue: 0,
    activeClients: 0,
    todayActivities: 0,
    attendanceRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showRevenue, setShowRevenue] = useState(true)

  const { checkMembershipStatus } = useClients()
  const { clients, loadClients } = useClients()
  const { activities, refreshActivities, getWeekDates } = useActivityContext()
  const { stats: clientStats, loading: clientStatsLoading } = useClientStats(
    user?.role === UserRole.CLIENT ? user?.id : undefined
  )
  const {
    currentShift,
    toggleShift,
    loading: loadingShift,
    dashboardStats: trainerStats,
    todayShift,
    getMonthlyHours
  } = useTrainer()

  const [showMonthlyHours, setShowMonthlyHours] = useState(false)

  const {
    totalPendingPayments,
    currentMonthRevenue,
    isLoading: isLoadingPayments
  } = usePaymentContext()
  const pendingPaymentsLoading = isLoadingPayments

  const [membershipStatus, setMembershipStatus] = useState<boolean | null>(null)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [trainerAttendanceDialog, setTrainerAttendanceDialog] = useState<{
    open: boolean
    activityId: number | null
  }>({ open: false, activityId: null })

  // Verificar términos y condiciones al montar
  useEffect(() => {
    if (user?.id && mounted && user?.role !== UserRole.ADMIN) {
      const hasAccepted = hasAcceptedTerms(user.id)
      if (!hasAccepted) {
        setShowTermsDialog(true)
      }
    }
  }, [user?.id, user?.role, mounted])

  const handleAcceptTerms = () => {
    setShowTermsDialog(false)
    toast({
      title: "Términos aceptados",
      description: "Bienvenido a Personal Fit Santa Fe",
    })
  }

  const handleRejectTerms = () => {
    setShowTermsDialog(false)
    toast({
      title: "Términos rechazados",
      description: "Has sido desconectado de la aplicación",
      variant: "destructive"
    })
    logout()
    router.push('/login')
  }

  // Marcar como montado e invalidar queries
  useEffect(() => {
    setMounted(true)
    loadClients()
    refreshActivities()

    if (user?.role === UserRole.CLIENT && user.id) {
      checkMembershipStatus(user.id).then(setMembershipStatus)
    }

    if (user?.role === UserRole.ADMIN) {
      // Placeholder for admin-specific initialization
    }
  }, [loadClients, refreshActivities, user?.role, queryClient])

  // Encontrar la próxima actividad del entrenador
  const getNextTrainerActivity = useCallback(() => {
    if (!user || (user.role !== UserRole.TRAINER && user.role !== UserRole.ADMIN)) return null
    const now = new Date()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayActivities = activities
      .filter(a => {
        const actDate = new Date(a.date)
        return actDate >= today && actDate < tomorrow &&
          a.status === ActivityStatus.ACTIVE
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const inProgress = todayActivities.find(a => {
      const start = new Date(a.date)
      const end = new Date(start.getTime() + a.duration * 60000)
      return start <= now && now <= end
    })
    if (inProgress) return inProgress

    const upcoming = todayActivities.find(a => new Date(a.date) > now)
    if (upcoming) return upcoming

    const futureActivities = activities
      .filter(a => new Date(a.date) > now && a.status === ActivityStatus.ACTIVE)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return futureActivities[0] || null
  }, [activities, user])

  const calculateWeeklyAttendanceRate = useCallback(async (): Promise<number> => {
    const weekStart = getWeekDates(new Date())[0]
    weekStart.setHours(0, 0, 0, 0)

    const now = new Date()

    const weekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.date)
      return (
        activity.status !== ActivityStatus.CANCELLED &&
        activityDate >= weekStart &&
        activityDate <= now
      )
    })

    if (weekActivities.length === 0) {
      return 0
    }

    const classRates = await Promise.all(
      weekActivities.map(async (activity) => {
        try {
          const activityDetail = await fetchActivityDetail(activity.id)
          const totalParticipants = activityDetail.participants.length

          if (totalParticipants === 0) {
            return null
          }

          const attendedParticipants = activityDetail.participants.filter(
            (participant: { status: string }) =>
              participant.status === AttendanceStatus.PRESENT ||
              participant.status === AttendanceStatus.LATE
          ).length

          return (attendedParticipants / totalParticipants) * 100
        } catch (error) {
          console.error(`Error loading attendance for activity ${activity.id}:`, error)
          return null
        }
      })
    )

    const validRates = classRates.filter((rate): rate is number => rate !== null)

    if (validRates.length === 0) {
      return 0
    }

    const weeklyAverage = validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length
    return Math.round(weeklyAverage)
  }, [activities, getWeekDates])

  // Calcular estadísticas reales
  useEffect(() => {
    if (!user || !mounted) {
      setIsLoading(false)
      return
    }

    let isCancelled = false

    const calculateStats = async () => {
      try {
        const monthlyRevenue = currentMonthRevenue?.amount || 0
        const activeClients = clients.filter(c => c.status === "ACTIVE").length
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const todayActivities = activities.filter(a => {
          const activityDate = new Date(a.date)
          return a.status === ActivityStatus.ACTIVE &&
            activityDate >= today &&
            activityDate < tomorrow
        }).length

        const attendanceRate = 0

        if (!isCancelled) {
          setDashboardStats({
            monthlyRevenue,
            activeClients,
            todayActivities,
            attendanceRate
          })
        }
      } catch (error) {
        console.error('Error calculating dashboard stats:', error)

        if (!isCancelled) {
          setDashboardStats({
            monthlyRevenue: 0,
            activeClients: 0,
            todayActivities: 0,
            attendanceRate: 0
          })
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    calculateStats()

    return () => {
      isCancelled = true
    }
  }, [user, clients, activities, mounted, currentMonthRevenue, calculateWeeklyAttendanceRate])

  // Tamaño dinámico de fuente
  const getDynamicFontSize = (text: string) => {
    const length = text.length;
    if (length <= 6) return "text-3xl";
    if (length <= 9) return "text-2xl";
    if (length <= 12) return "text-xl";
    if (length <= 15) return "text-lg";
    return "text-base";
  }

  // Navegación con validaciones
  const handleNavigation = (route: string, title: string) => {
    if (route === "/payments/verify" && user?.role === UserRole.ADMIN) {
      if (totalPendingPayments === 0) {
        toast({
          title: "Sin pagos pendientes",
          description: "No hay pagos pendientes de verificación",
          variant: "default"
        })
        return
      }
    }
    router.push(route)
  }

  const navigateToNextTrainerActivity = () => {
    const next = getNextTrainerActivity()
    if (next) {
      router.push('/activities')
    } else {
      toast({
        title: "Sin actividades",
        description: "No tenés actividades próximas programadas.",
        variant: "default"
      })
    }
  }

  const openNextActivityAttendance = () => {
    const next = getNextTrainerActivity()
    if (next) {
      setTrainerAttendanceDialog({ open: true, activityId: next.id })
    } else {
      toast({
        title: "Sin actividades",
        description: "No tenés actividades próximas para tomar asistencia.",
        variant: "default"
      })
    }
  }

  // Determinar si está en estado de carga
  const pageIsLoading = !user || isLoading ||
    (user.role === UserRole.CLIENT && clientStatsLoading) ||
    (user.role === UserRole.ADMIN && pendingPaymentsLoading) ||
    (user.role === UserRole.TRAINER && loadingShift)

  // --- Dashboard stats por rol ---
  const getDashboardStatsForRole = (): DashboardStat[] => {
    if (!user) return []

    if (user.role === UserRole.ADMIN) {
      const nextActivity = getNextTrainerActivity();
      const nextClassValue = nextActivity
        ? new Date(nextActivity.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        : "Sin clases";
      const nextClassName = nextActivity?.name ?? "N/A";

      return [
        {
          title: "Clientes Activos",
          value: dashboardStats.activeClients.toString(),
          icon: Users,
          description: "este mes",
          dynamicFontSize: getDynamicFontSize(dashboardStats.activeClients.toString()),
          color: "bg-orange-500"
        },
        {
          title: "Clases Hoy",
          value: dashboardStats.todayActivities.toString(),
          icon: Activity,
          description: "programadas",
          dynamicFontSize: "text-2xl",
          color: "bg-orange-500"
        },
        {
          title: "Próxima Clase",
          value: nextClassValue,
          icon: Calendar,
          description: nextClassName,
          dynamicFontSize: "text-2xl",
          color: "bg-orange-500"
        },
      ];
    } else if (user.role === UserRole.TRAINER) {
      if (!trainerStats) return [];

      const formatShiftTime = (isoStr: string | null) => {
        if (!isoStr) return "--:--";
        return new Date(isoStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      };

      const nextClassValue = trainerStats.nextClassTime
        ? new Date(String(trainerStats.nextClassTime)).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        : "Sin clases";

      return [
        {
          title: "Check-in",
          value: formatShiftTime(todayShift.checkInTime),
          icon: LogIn,
          description: todayShift.hasCheckedIn ? "Registrado hoy" : "No registrado",
          dynamicFontSize: "text-2xl",
          color: todayShift.hasCheckedIn ? "success" : "destructive"
        },
        {
          title: "Check-out",
          value: formatShiftTime(todayShift.checkOutTime),
          icon: LogOut,
          description: todayShift.hasCheckedOut ? "Registrado hoy" : "No registrado",
          dynamicFontSize: "text-2xl",
          color: todayShift.hasCheckedOut ? "success" : "destructive"
        },
        {
          title: "Clases Hoy",
          value: String(trainerStats.classesToday ?? 0),
          icon: Activity,
          description: "programadas",
          dynamicFontSize: "text-2xl",
          color: "bg-orange-500"
        },
        {
          title: "Próxima Clase",
          value: nextClassValue,
          icon: Calendar,
          description: typeof trainerStats.nextClassName === 'string' ? trainerStats.nextClassName : "N/A",
          dynamicFontSize: "text-2xl",
          color: "bg-orange-500"
        },
      ];
    } else {
      const formatNextClass = () => {
        if (!clientStats.nextClass) return "Sin clases";
        const classDate = new Date(clientStats.nextClass.date);
        const today = new Date();
        const isToday = classDate.toDateString() === today.toDateString();
        if (isToday) {
          return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(classDate);
        } else {
          return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(classDate);
        }
      };

      const nextClassValue = formatNextClass();
      const nextClassName = clientStats.nextClass?.name ?? "Sin clase";
      const diasRestantes = clientStats.remainingDays ?? 0;
      const actividadesMes = clientStats.weeklyActivityCount ?? 0;
      const faltasDelMes = 0;

      return [
        {
          title: "Próxima Clase",
          value: nextClassValue,
          icon: Clock,
          description: nextClassName,
          color: "bg-gray-500",
          dynamicFontSize: "text-2xl"
        },
        {
          title: "Actividades este mes",
          value: actividadesMes.toString(),
          icon: Activity,
          description: "completadas",
          color: "warning",
          dynamicFontSize: "text-2xl"
        },
        {
          title: "Faltas del mes",
          value: `${faltasDelMes}`,
          icon: Target,
          description: "inasistencias",
          color: "bg-orange-500",
          dynamicFontSize: "text-2xl"
        },
        {
          title: "Estado del plan",
          value: diasRestantes > 0 ? "Plan activo" : "Sin plan activo",
          icon: CheckCircle,
          description: diasRestantes > 0 ? `Restan ${diasRestantes} días` : "Membresía vencida",
          color: diasRestantes > 0 ? "success" : "destructive",
          dynamicFontSize: "text-2xl"
        },
      ];
    }
  }

  // --- Quick actions por rol ---
  const getQuickActionsForRole = (): QuickAction[] => {
    if (!user) return []

    if (user.role === UserRole.ADMIN) {
      return [
        { title: "Tomar Asistencia", onClick: () => openNextActivityAttendance(), icon: CheckCircle, color: "bg-orange-500" },
        { title: "Mis Actividades", onClick: () => navigateToNextTrainerActivity(), icon: Activity, color: "bg-gray-500" },
        { title: "Verificar Pagos", route: "/payments/verify", icon: CreditCard, color: "bg-gray-500" },
        { title: "Ver Reportes", route: "/reports", icon: TrendingUp, color: "bg-orange-500" },
      ]
    } else if (user.role === UserRole.TRAINER) {
      return [
        { title: "Mis Actividades", onClick: () => navigateToNextTrainerActivity(), icon: Activity, color: "bg-orange-500" },
        { title: "Tomar Asistencia", onClick: () => openNextActivityAttendance(), icon: CheckCircle, color: "bg-gray-500" },
        { title: "Horas del Mes", onClick: () => setShowMonthlyHours(true), icon: Timer, color: "bg-gray-500" },
      ]
    } else {
      return [
        { title: "Ver Actividades", route: "/activities", icon: Activity, color: "bg-orange-500" },
        { title: "Mi Resumen", route: "/reports", icon: BarChart3, color: "bg-orange-500" },
        { title: "Mi Progreso", route: "/progress", icon: TrendingUp, color: "bg-gray-500" },
        { title: "Realizar Pago", route: "/payments", icon: CreditCard, color: "bg-gray-500" },
        { title: "Mi Perfil", onClick: () => setShowProfileDialog(true), icon: Users, color: "bg-gray-500" },
      ]
    }
  }

  // --- Alerts por rol ---
  const getAlertsForRole = (): DashboardAlert[] => {
    if (!user) return []

    if (user.role === UserRole.ADMIN) {
      return totalPendingPayments > 0
        ? [{ type: "warning", message: `${totalPendingPayments} pagos pendientes a validar`, action: "Ver pagos", route: "/payments/verify" }]
        : []
    } else if (user.role === UserRole.TRAINER) {
      const alerts: DashboardAlert[] = [];

      if (!todayShift.hasCheckedIn) {
        alerts.push({ type: "warning", message: "No registraste tu check-in hoy. Recordá usar el módulo físico para fichar." });
      } else if (!todayShift.hasCheckedOut) {
        alerts.push({ type: "warning", message: "No olvides registrar tu check-out con el módulo físico al finalizar tu jornada." });
      }

      if (trainerStats?.nextClassTime) {
        const nextClassTime = new Date(trainerStats.nextClassTime);
        const now = new Date();
        const diffMinutes = Math.floor((nextClassTime.getTime() - now.getTime()) / (1000 * 60));
        if (diffMinutes > 0 && diffMinutes <= 60) {
          alerts.push({ type: "info", message: `Clase de ${trainerStats.nextClassName || 'Entrenamiento'} en ${diffMinutes} minutos`, action: "Ver detalles", route: "/activities" });
        }
      }

      return alerts;
    } else {
      const hasActiveMembership = membershipStatus !== null ? membershipStatus : user.status === "ACTIVE"
      if (!hasActiveMembership) {
        return [{ type: "warning", message: "Realiza un pago para reactivar tu plan.", action: "Realizar pago", route: "/payments" }];
      }
      return [
        { type: "info", message: `¡Felicidades! Completaste ${clientStats.weeklyActivityCount || 0} actividades este mes`, action: "Ver progreso", route: "/progress" },
      ];
    }
  }

  const stats = getDashboardStatsForRole()
  const quickActions = getQuickActionsForRole()
  const alerts = getAlertsForRole()

  return {
    // State
    user,
    mounted,
    isLoading: pageIsLoading,
    showRevenue,
    setShowRevenue,
    showMonthlyHours,
    setShowMonthlyHours,
    showProfileDialog,
    setShowProfileDialog,
    showTermsDialog,
    trainerAttendanceDialog,
    setTrainerAttendanceDialog,

    // Dashboard computed data
    stats,
    quickActions,
    alerts,

    // Handlers
    handleAcceptTerms,
    handleRejectTerms,
    handleNavigation,
    getMonthlyHours,
  }
}
