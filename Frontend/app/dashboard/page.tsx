"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Progress } from "@/components/ui/progress"
import { useActivities } from "@/hooks/use-activity"
import { useClients } from "@/hooks/use-client"
import { useClientStats } from "@/hooks/use-client-stats"
import { usePayment } from "@/hooks/use-payment"
import { usePendingPayments } from "@/hooks/use-pending-payments"
import { ActivityStatus, PaymentStatus, UserRole } from "@/lib/types"
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Target,
  TrendingUp,
  Users,
  Zap
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

// Componente que se renderiza solo en el cliente
function DashboardContent() {
  const { user } = useAuth()
  const [dashboardStats, setDashboardStats] = useState({
    monthlyRevenue: 0,
    activeClients: 0,
    todayActivities: 0,
    attendanceRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showRevenue, setShowRevenue] = useState(true)

  // Usar hooks de forma segura
  const paymentHook = usePayment(user?.id, user?.role === UserRole.ADMIN)
  const { 
    pendingPayments, 
    totalPendingPayments, 
    loading: pendingPaymentsLoading 
  } = usePendingPayments(user?.id, user?.role === UserRole.ADMIN)
  const { clients, loadClients } = useClients()
  const { activities, loadActivities } = useActivities()
  const { stats: clientStats, loading: clientStatsLoading } = useClientStats(user?.role === UserRole.CLIENT ? user?.id : undefined)

  // Extraer datos de forma segura
  const payments = paymentHook?.payments || []

  // Marcar como montado para evitar SSR
  useEffect(() => {
    setMounted(true)
    loadClients()
    loadActivities()
  }, [loadClients, loadActivities])

  // Calcular estadísticas reales
  useEffect(() => {
    if (!user || !mounted) {
      setIsLoading(false)
      return
    }

    try {
      // 1. Ingresos del mes (solo pagos pagados)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRevenue = payments
        .filter(p => {
          const paymentDate = p.createdAt ? new Date(p.createdAt) : null
          return p.status === PaymentStatus.PAID &&
            paymentDate &&
            paymentDate.getMonth() === currentMonth &&
            paymentDate.getFullYear() === currentYear
        })
        .reduce((sum, p) => sum + p.amount, 0)

      // 2. Clientes activos
      const activeClients = clients.filter(c => c.status === "ACTIVE").length
      // 3. Actividades de hoy (que aún no han terminado)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayActivities = activities.filter(a => {
        return a.status === ActivityStatus.ACTIVE
      }).length

      // 4. Tasa de asistencia (simulada por ahora)
      const attendanceRate = 87 // Esto se puede calcular más adelante con datos reales

      setDashboardStats({
        monthlyRevenue,
        activeClients,
        todayActivities,
        attendanceRate
      })
    } catch (error) {
      console.error('Error calculating dashboard stats:', error)
      setDashboardStats({
        monthlyRevenue: 0,
        activeClients: 0,
        todayActivities: 0,
        attendanceRate: 87
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, payments, clients, activities, mounted])

  // Evitar renderizado durante SSR
  if (!mounted) {
    return null
  }

  if (!user || isLoading || (user.role === UserRole.CLIENT && clientStatsLoading) || (user.role === UserRole.ADMIN && pendingPaymentsLoading)) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <MobileHeader title="Cargando..." />
        <div className="container-centered py-6 space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Cargando dashboard...</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    )
  }

  // Función para calcular el tamaño dinámico de la fuente basado en la longitud del texto
  const getDynamicFontSize = (text: string) => {
    const length = text.length;
    if (length <= 6) return "text-3xl"; // Números pequeños
    if (length <= 9) return "text-2xl"; // Números medianos
    if (length <= 12) return "text-xl";  // Números grandes
    if (length <= 15) return "text-lg";  // Números muy grandes
    return "text-base"; // Números extremadamente grandes
  }

  const getDashboardStats = () => {
    if (user.role === UserRole.ADMIN) {
      const revenueValue = showRevenue ? `$${dashboardStats.monthlyRevenue.toLocaleString('es-AR')}` : "••••••";
      return [
        {
          title: "Ingresos del Mes",
          value: revenueValue,
          icon: CreditCard,
          description: "vs mes anterior",
          isRevenue: true,
          dynamicFontSize: getDynamicFontSize(revenueValue)
        },
        {
          title: "Clientes Activos",
          value: dashboardStats.activeClients.toString(),
          icon: Users,
          description: "este mes"
        },
        {
          title: "Actividades Hoy",
          value: dashboardStats.todayActivities.toString(),
          icon: Activity,
          description: "en progreso"
        },
        {
          title: "Tasa de Asistencia",
          value: `${dashboardStats.attendanceRate}%`,
          icon: Target,
          description: "promedio semanal"
        },
      ]
    } else if (user.role === UserRole.TRAINER) {
      return [
        {
          title: "Mis Clientes",
          value: "42",
          icon: Users,
          description: "asignados"
        },
        {
          title: "Clases Hoy",
          value: "6",
          icon: Activity,
          description: "programadas"
        },
        {
          title: "Asistencia Promedio",
          value: "92%",
          icon: Target,
          description: "esta semana"
        },
        {
          title: "Próxima Clase",
          value: "2:00 PM",
          icon: Clock,
          description: "en 45 min"
        },
      ]
    } else {
      // Formatear la próxima clase
      const formatNextClass = () => {
        if (!clientStats.nextClass) return "Sin clases";

        const classDate = new Date(clientStats.nextClass.date);
        const today = new Date();

        // Comparar solo las fechas (sin horas)
        const isToday = classDate.toDateString() === today.toDateString();

        if (isToday) {
          // Solo mostrar la hora si es hoy
          return new Intl.DateTimeFormat("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(classDate);
        } else {
          // Mostrar fecha y hora si es otro día
          return new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).format(classDate);
        }
      };

      const nextClassValue = formatNextClass();

      return [
        {
          title: "Actividades Inscritas",
          value: clientStats.weeklyActivityCount.toString(),
          icon: Activity,
          description: "este mes"
        },
        {
          title: "Próxima Clase",
          value: nextClassValue,
          icon: Clock,
          description: "mañana"
        },
        {
          title: "Progreso Mensual",
          value: "75%",
          icon: Target,
          description: "completadas"
        },
        {
          title: "Estado de Pago",
          value: "Al día",
          icon: CheckCircle,
          description: "sin pendientes"
        },
      ]
    }
  }

  const getQuickActions = () => {
    if (user.role === UserRole.ADMIN) {
      return [
        { title: "Nueva Actividad", href: "/activities/new", icon: Activity, color: "bg-orange-500" },
        { title: "Gestionar Clientes", href: "/clients", icon: Users, color: "bg-gray-500" },
        { title: "Verificar Pagos", href: "/payments/verify", icon: CreditCard, color: "bg-gray-500" },
        { title: "Ver Reportes", href: "/reports", icon: TrendingUp, color: "bg-orange-500" },
      ]
    } else if (user.role === UserRole.TRAINER) {
      return [
        { title: "Mis Actividades", href: "/activities", icon: Activity, color: "bg-purple-500" },
        { title: "Tomar Asistencia", href: "/attendance", icon: CheckCircle, color: "bg-emerald-500" },
        { title: "Ver Clientes", href: "/clients", icon: Users, color: "bg-blue-500" },
        { title: "Mi Horario", href: "/schedule", icon: Calendar, color: "bg-orange-500" },
      ]
    } else {
      return [
        { title: "Ver Actividades", href: "/activities", icon: Activity, color: "bg-blue-500" },
        { title: "Mi Progreso", href: "/progress", icon: TrendingUp, color: "bg-emerald-500" },
        { title: "Realizar Pago", href: "/payments", icon: CreditCard, color: "bg-purple-500" },
        { title: "Mi Perfil", href: "/profile", icon: Users, color: "bg-orange-500" },
      ]
    }
  }

  const getAlerts = () => {
    if (user.role === UserRole.ADMIN) {
      // Usar el hook de pagos pendientes para obtener la cantidad actualizada
      return totalPendingPayments > 0
        ? [{ 
            type: "info", 
            message: `${totalPendingPayments} pagos pendientes requieren atención`, 
            action: "Ver pagos", 
            href: "/payments/verify" 
          }]
        : []
    } else if (user.role === UserRole.TRAINER) {
      return [
        { type: "info", message: "Clase de Yoga en 45 minutos", action: "Ver detalles", href: "/activities" },
        { type: "success", message: "Excelente asistencia esta semana (92%)", action: "Ver estadísticas", href: "/stats" },
      ]
    } else {
      return [
        { type: "success", message: "¡Felicidades! Completaste 18 clases este mes", action: "Ver progreso", href: "/progress" },
        { type: "info", message: "Nueva clase de Pilates disponible", action: "Inscribirse", href: "/activities" },
      ]
    }
  }

  const stats = getDashboardStats()
  const quickActions = getQuickActions()
  const alerts = getAlerts()

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title={`Hola, ${user.firstName}`} />

      <div className="container-centered py-6 space-y-6">
        {/* Welcome Section - Diseño profesional con nueva paleta */}
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-8 text-white shadow-professional-lg">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-3 tracking-tight">
                  {user.role === UserRole.ADMIN && "Panel de Control"}
                  {user.role === UserRole.TRAINER && "Centro de Entrenador"}
                  {user.role === UserRole.CLIENT && "Mi Entrenamiento"}
                </h1>
                <p className="text-white/90 text-base font-medium">
                  {user.role === UserRole.ADMIN && "Gestiona tu gimnasio de manera eficiente"}
                  {user.role === UserRole.TRAINER && "Inspira y guía a tus clientes"}
                  {user.role === UserRole.CLIENT && "Alcanza tus objetivos de fitness"}
                </p>
              </div>
              <div className="text-right bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-sm text-white/80 mb-1 font-medium">
                  {new Date().toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </div>
                <div className="text-2xl font-bold">
                  {new Date().toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
          {/* Elementos decorativos modernos */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-white/20 rounded-full"></div>
          <div className="absolute top-1/4 right-1/3 w-1 h-1 bg-white/30 rounded-full"></div>
        </div>

        {/* Alerts Section - Diseño profesional */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <Card
                key={index}
                className={`border-l-4 shadow-professional transition-all duration-200 hover:shadow-professional-lg ${alert.type === "warning"
                  ? "border-l-warning bg-warning/5 hover:bg-warning/10"
                  : alert.type === "info"
                    ? "border-l-secondary bg-secondary/5 hover:bg-secondary/10"
                    : "border-l-success bg-success/5 hover:bg-success/10"
                  }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${alert.type === "warning" ? "bg-warning/20" :
                        alert.type === "info" ? "bg-secondary/20" : "bg-success/20"
                        }`}>
                        {alert.type === "warning" && <AlertTriangle className="h-5 w-5 text-warning" />}
                        {alert.type === "info" && <Bell className="h-5 w-5 text-secondary" />}
                        {alert.type === "success" && <CheckCircle className="h-5 w-5 text-success" />}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{alert.message}</span>
                    </div>
                    <Link href={alert.href}>
                      <Button variant="ghost" size="sm" className="text-xs font-medium hover:bg-background/50 rounded-xl">
                        {alert.action}
                        <ArrowUpRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Grid - Diseño profesional moderno */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden shadow-professional hover:shadow-professional-lg transition-all duration-300 border-0 bg-card">
              <CardContent className="p-5">
                {/* Icono plano en la esquina */}
                <div className="absolute top-4 right-4 flex items-center gap-1">
                  <stat.icon className="h-6 w-6 text-foreground" />
                  {stat.isRevenue && (
                    <button
                      onClick={() => setShowRevenue(!showRevenue)}
                      className="p-1 hover:bg-muted rounded-full transition-colors"
                      aria-label={showRevenue ? "Ocultar ingresos" : "Mostrar ingresos"}
                    >
                      {showRevenue ? (
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  )}
                </div>

                <div className="pr-16">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">{stat.title}</p>
                  <p className={`${stat.dynamicFontSize || "text-3xl"} font-bold text-foreground mb-2 tracking-tight`}>{stat.value}</p>

                  <p className="text-xs text-muted-foreground font-medium">{stat.description}</p>
                </div>

                {/* Elemento decorativo */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-primary opacity-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress Section for Clients - Diseño profesional */}
        {user.role === UserRole.CLIENT && (
          <Card className="shadow-professional border-0 bg-gradient-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                Tu Progreso Este Mes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-background/50 rounded-2xl p-4">
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-semibold text-foreground">Clases Completadas</span>
                  <span className="font-bold text-primary">18/24</span>
                </div>
                <Progress value={75} className="h-3 bg-muted" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center bg-background/50 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-primary mb-1">18</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completadas</div>
                </div>
                <div className="text-center bg-background/50 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-secondary mb-1">6</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Restantes</div>
                </div>
                <div className="text-center bg-background/50 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-success mb-1">92%</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Asistencia</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions - Diseño profesional */}
        <Card className="shadow-professional border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full h-auto p-6 flex flex-col gap-4 border-2 border-border/50 bg-background hover:bg-accent/50 hover:border-primary/50 shadow-professional hover:shadow-professional-lg transition-all duration-300 rounded-2xl group"
                >
                  <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center shadow-professional group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{action.title}</span>
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity - Diseño profesional */}
        <Card className="shadow-professional border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gradient-card rounded-2xl border border-border/30 hover:border-primary/30 transition-all duration-200">
              <div className="w-3 h-3 bg-success rounded-full shadow-professional"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Nueva inscripción</p>
                <p className="text-xs text-muted-foreground font-medium">María se inscribió a Yoga Matutino</p>
              </div>
              <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full font-medium">Hace 5 min</span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gradient-card rounded-2xl border border-border/30 hover:border-primary/30 transition-all duration-200">
              <div className="w-3 h-3 bg-secondary rounded-full shadow-professional"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Pago recibido</p>
                <p className="text-xs text-muted-foreground font-medium">Juan completó el pago de $150</p>
              </div>
              <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full font-medium">Hace 15 min</span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gradient-card rounded-2xl border border-border/30 hover:border-primary/30 transition-all duration-200">
              <div className="w-3 h-3 bg-primary rounded-full shadow-professional"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Clase completada</p>
                <p className="text-xs text-muted-foreground font-medium">CrossFit Avanzado - 12 asistentes</p>
              </div>
              <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full font-medium">Hace 1 hora</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
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
