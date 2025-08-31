"use client"

import { ClientDetailsDialog } from "@/components/clients/details-client-dialog"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useActivityContext } from "@/contexts/activity-provider"
import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { usePaymentContext } from "@/contexts/payment-provider"
import { useClients } from "@/hooks/clients/use-client"
import { useClientStats } from "@/hooks/clients/use-client-stats"
import { useToast } from "@/hooks/use-toast"
import { ActivityStatus, UserRole } from "@/lib/types"
import { useQueryClient } from "@tanstack/react-query"
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
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// Componente que se renderiza solo en el cliente
function DashboardContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Use custom hook to redirect to login if not authenticated
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

  // Usar hooks de forma segura
  const { checkMembershipStatus } = useClients()
  const { clients, loadClients } = useClients()
  const { activities, refreshActivities } = useActivityContext()
  const { stats: clientStats, loading: clientStatsLoading } = useClientStats(user?.role === UserRole.CLIENT ? user?.id : undefined)

  // Usar el contexto unificado de pagos
  const {
    totalPendingPayments,
    currentMonthRevenue,
    isLoading: isLoadingPayments
  } = usePaymentContext()
  const pendingPaymentsLoading = isLoadingPayments

  // Estado para cachear el estado de membresía
  const [membershipStatus, setMembershipStatus] = useState<boolean | null>(null)

  // Estado para el dialog de perfil del cliente
  const [showProfileDialog, setShowProfileDialog] = useState(false)

  // Marcar como montado para evitar SSR e invalidar queries para datos frescos
  useEffect(() => {
    setMounted(true)
    loadClients()
    refreshActivities()

    // Para clientes, verificar estado de membresía
    if (user?.role === UserRole.CLIENT && user.id) {
      checkMembershipStatus(user.id).then(setMembershipStatus)
    }

    // Invalidar queries para asegurar datos frescos al entrar al dashboard
    if (user?.role === UserRole.ADMIN) {
    }
  }, [loadClients, refreshActivities, user?.role, queryClient])

  // Calcular estadísticas reales
  useEffect(() => {
    if (!user || !mounted) {
      setIsLoading(false)
      return
    }

    try {
      // 1. Ingresos del mes (usar datos calculados desde usePayment)
      const monthlyRevenue = currentMonthRevenue?.amount || 0

      // 2. Clientes activos
      const activeClients = clients.filter(c => c.status === "ACTIVE").length
      // 3. Actividades de hoy (que aún no han terminado)
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
  }, [user, clients, activities, mounted])

  // Evitar renderizado durante SSR
  if (!mounted) {
    return null
  }

  if (!user || isLoading || (user.role === UserRole.CLIENT && clientStatsLoading) || (user.role === UserRole.ADMIN && pendingPaymentsLoading)) {
    return (
      <div className="min-h-screen bg-background pb-32">
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
          dynamicFontSize: getDynamicFontSize(revenueValue),
          color: "primary"
        },
        {
          title: "Clientes Activos",
          value: dashboardStats.activeClients.toString(),
          icon: Users,
          description: "este mes",
          dynamicFontSize: getDynamicFontSize(dashboardStats.activeClients.toString()),
          color: "primary"
        },
        {
          title: "Actividades Hoy",
          value: dashboardStats.todayActivities.toString(),
          icon: Activity,
          description: "en progreso",
          dynamicFontSize: getDynamicFontSize(dashboardStats.todayActivities.toString()),
          color: "primary"
        },
        {
          title: "Tasa de Asistencia",
          value: `${dashboardStats.attendanceRate}%`,
          icon: Target,
          description: "promedio semanal",
          dynamicFontSize: getDynamicFontSize(`${dashboardStats.attendanceRate}%`),
          color: "primary"
        },
      ];
    } else if (user.role === UserRole.TRAINER) {
      return [
        {
          title: "Mis Clientes",
          value: "42",
          icon: Users,
          description: "asignados",
          dynamicFontSize: "text-2xl",
          color: "primary"
        },
        {
          title: "Clases Hoy",
          value: "6",
          icon: Activity,
          description: "programadas",
          dynamicFontSize: "text-2xl",
          color: "primary"
        },
        {
          title: "Asistencia Promedio",
          value: "92%",
          icon: Target,
          description: "esta semana",
          dynamicFontSize: "text-2xl",
          color: "primary"
        },
        {
          title: "Próxima Clase",
          value: "2:00 PM",
          icon: Clock,
          description: "en 45 min",
          dynamicFontSize: "text-2xl",
          color: "primary"
        },
      ];
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
      const nextClassName = clientStats.nextClass?.name ?? "Sin clase";
      // Obtener días restantes del backend directamente
      const diasRestantes = clientStats.remainingDays ?? 0;

      // Progreso mensual de actividades (fallback a weeklyActivityCount si no existe)
      const actividadesMes = clientStats.weeklyActivityCount ?? 0;
      // clientStats.faltasDelMes ?? 
      const faltasDelMes = 0;

      // Estructura uniforme para stats - Reordenadas según layout solicitado
      return [
        {
          title: "Próxima Clase",
          value: nextClassValue,
          icon: Clock,
          description: nextClassName,
          color: "secondary",
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
          color: "primary",
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

  // Función para manejar navegación con validaciones especiales
  const handleNavigation = (route: string, title: string) => {
    // Para reportes - mostrar toast en desarrollo
    if (route === "/reports") {
      toast({
        title: "Función en desarrollo",
        description: "Estamos trabajando en generar reportes",
        variant: "default"
      })
      return
    }

    // Para verificar pagos - validar si hay pagos pendientes
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

    // Navegación normal
    router.push(route)
  }

  const getQuickActions = () => {
    if (user.role === UserRole.ADMIN) {
      return [
        { title: "Nueva Actividad", route: "/activities/new", icon: Activity, color: "bg-orange-500" },
        { title: "Gestionar Clientes", route: "/clients", icon: Users, color: "bg-gray-500" },
        { title: "Verificar Pagos", route: "/payments/verify", icon: CreditCard, color: "bg-gray-500" },
        { title: "Ver Reportes", route: "/reports", icon: TrendingUp, color: "bg-orange-500" },
      ]
    } else if (user.role === UserRole.TRAINER) {
      return [
        { title: "Mis Actividades", route: "/activities", icon: Activity, color: "bg-orange-500" },
        { title: "Tomar Asistencia", route: "/attendance", icon: CheckCircle, color: "bg-gray-500" },
        { title: "Ver Clientes", route: "/clients", icon: Users, color: "bg-gray-500" },
        { title: "Mi Horario", route: "/schedule", icon: Calendar, color: "bg-orange-500" },
      ]
    } else {
      return [
        { title: "Ver Actividades", route: "/activities", icon: Activity, color: "bg-orange-500" },
        { title: "Mi Progreso", route: "/progress", icon: TrendingUp, color: "bg-gray-500" },
        { title: "Realizar Pago", route: "/payments", icon: CreditCard, color: "bg-gray-500" },
        { title: "Mi Perfil", onClick: () => setShowProfileDialog(true), icon: Users, color: "bg-orange-500" },
      ]
    }
  }

  const getAlerts = () => {
    if (user.role === UserRole.ADMIN) {
      return totalPendingPayments > 0
        ? [{
          type: "warning",
          message: `${totalPendingPayments} pagos pendientes a validar`,
          action: "Ver pagos",
          route: "/payments/verify"
        }]
        : []
    } else if (user.role === UserRole.TRAINER) {
      return [
        { type: "info", message: "Clase de Yoga en 45 minutos", action: "Ver detalles", route: "/activities" },
        { type: "success", message: "Excelente asistencia esta semana (92%)", action: "Ver estadísticas", route: "/stats" },
      ]
    } else {
      // Usar el estado de membresía validado por el backend
      const hasActiveMembership = membershipStatus !== null ? membershipStatus : user.status === "ACTIVE"

      if (!hasActiveMembership) {
        return [{ type: "warning", message: "Realiza un pago para reactivar tu plan.", action: "Realizar pago", route: "/payments" }];
      }
      return [
        { type: "info", message: `¡Felicidades! Completaste ${clientStats.weeklyActivityCount || 0} actividades este mes`, action: "Ver progreso", route: "/progress" },
      ];
    }
  }

  const stats = getDashboardStats()
  const quickActions = getQuickActions()
  const alerts = getAlerts()

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title={`Hola, ${user.firstName}`} />

      <div className="container-centered h-full py-6 space-y-6">
        {/* Welcome Section - Diseño profesional con imagen de fondo */}
        <div className="relative overflow-hidden rounded-3xl shadow-professional-lg">
          {/* Imagen de fondo */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/dashboard.png')"
            }}
          />
          {/* Overlay para mejorar legibilidad del texto */}
          <div className="absolute inset-0 bg-black/10 rounded-3xl" />

          <div className="relative z-10 p-24 text-white">
            <div className="flex items-center justify-between">
              {/* <div className="flex-1">
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
              </div> */}
              {/* <div className="text-right bg-white/10 backdrop-blur-sm rounded-2xl p-4">
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
              </div> */}
            </div>
          </div>
        </div>

        {/* Alerts Section - Diseño profesional */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <Card
                key={index}
                className={`border-l-4 shadow-professional transition-all duration-200 hover:shadow-professional-lg ${alert.type === "warning"
                  ? "border-l-primary hover:bg-background/50"
                  : alert.type === "info"
                    ? "border-l-primary hover:bg-background/50"
                    : "border-l-success bg-success/5 hover:bg-success/10"
                  }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-primary flex-shrink-0" />}
                      {alert.type === "info" && <Bell className="h-4 w-4 text-primary flex-shrink-0" />}
                      {alert.type === "success" && <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />}
                      <span className="text-sm font-semibold text-foreground flex-1">{alert.message}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-medium hover:bg-background/50 rounded-xl"
                      onClick={() => handleNavigation(alert.route, alert.action)}
                    >
                      {alert.action}
                      <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Grid - Diseño profesional moderno */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => {
            // Determinar el span de columnas: primera y última card ocupan 2 columnas
            const colSpan = (index === 0 || index === 3) ? "col-span-2" : "col-span-1";
            
            return (
              <Card key={index} className={`relative overflow-hidden shadow-professional hover:shadow-professional-lg transition-all duration-300 border-0 bg-card min-h-[160px] flex flex-col justify-center ${colSpan}`}>
                <CardContent className="p-5 flex flex-col justify-center h-full">
                  {/* Icono plano en la esquina */}
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    <stat.icon className={`h-6 w-6 ${stat.color === "success" ? "text-green-600" : stat.color === "destructive" ? "text-red-600" : "text-foreground"}`} />
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
                    <p className={`${stat.dynamicFontSize || "text-3xl"} font-bold ${stat.color === "success" ? "text-green-700" : stat.color === "destructive" ? "text-red-700" : "text-foreground"} mb-2 tracking-tight`}>{stat.value}</p>
                    <p className={`text-xs font-medium ${stat.color === "success" ? "text-green-700" : stat.color === "destructive" ? "text-red-700" : "text-muted-foreground"}`}>{stat.description}</p>
                  </div>

                  {/* Elemento decorativo */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-primary opacity-20"></div>
                </CardContent>
              </Card>
            );
          })}
        </div>

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
            {quickActions.map((action, index) => {
              if (action.onClick) {
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full h-auto p-6 flex flex-col gap-4 border-2 border-border/50 bg-background hover:bg-accent/50 hover:border-primary/50 shadow-professional hover:shadow-professional-lg transition-all duration-300 rounded-2xl group"
                    onClick={action.onClick}
                  >
                    <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center shadow-professional group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{action.title}</span>
                  </Button>
                )
              } else {
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full h-auto p-6 flex flex-col gap-4 border-2 border-border/50 bg-background hover:bg-accent/50 hover:border-primary/50 shadow-professional hover:shadow-professional-lg transition-all duration-300 rounded-2xl group"
                    onClick={() => handleNavigation(action.route, action.title)}
                  >
                    <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center shadow-professional group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{action.title}</span>
                  </Button>
                )
              }
            })}
          </CardContent>
        </Card>

        {/* Recent Activity - Diseño profesional */}
        {/* <Card className="shadow-professional border-0">
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
        </Card> */}
      </div>

      <BottomNav />

      {/* Dialog de perfil para clientes */}
      {user?.role === UserRole.CLIENT && user.id && (
        <ClientDetailsDialog
          open={showProfileDialog}
          onOpenChange={setShowProfileDialog}
          userId={user.id}
        />
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
