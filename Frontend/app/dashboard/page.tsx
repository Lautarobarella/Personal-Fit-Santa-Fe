"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useActivities } from "@/hooks/use-activity"
import { useClients } from "@/hooks/use-client"
import { useClientStats } from "@/hooks/use-client-stats"
import { usePayment } from "@/hooks/use-payment"
import { ActivityStatus, PaymentStatus, UserRole, UserStatus } from "@/lib/types"
import { Activity, Calendar, CheckCircle, Clock, CreditCard, TrendingUp, Users, XCircle } from "lucide-react"
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

  // Usar hooks de forma segura
  const paymentHook = usePayment(user?.id, user?.role === UserRole.ADMIN)
  const { clients, loadClients } = useClients()
  const { activities, loadActivities } = useActivities()
  const { stats: clientStats, loading: clientStatsLoading } = useClientStats(user?.role === UserRole.CLIENT ? user?.id : undefined)

  // Extraer datos de forma segura
  const payments = paymentHook?.payments || []
  // const clients = clientsHook?.clients || []
  // const activities = activitiesHook?.activities || []

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
        // const activityDate = new Date(a.date)
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

  if (!user || isLoading || (user.role === UserRole.CLIENT && clientStatsLoading)) {
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

  const getDashboardStats = () => {
    if (user.role === UserRole.ADMIN) {
      return [
        { title: "Actividades del día", value: dashboardStats.todayActivities.toString(), icon: Activity, color: "text-blue-600", subtitle: "" },
        { title: "Clientes Activos", value: dashboardStats.activeClients.toString(), icon: Users, color: "text-green-600", subtitle: "" },
        { title: "Ingresos del Mes", value: `$${dashboardStats.monthlyRevenue.toLocaleString('es-AR')}`, icon: CreditCard, color: "text-purple-600", subtitle: "Generado" },
        { title: "Asistencia Promedio", value: `${dashboardStats.attendanceRate}%`, icon: TrendingUp, color: "text-orange-600", subtitle: "" },
      ]
    } else if (user.role === UserRole.TRAINER) {
      return [
        { title: "Mis Actividades", value: "8", icon: Activity, color: "text-blue-600", subtitle: "clases asignadas" },
        { title: "Mis Clientes", value: "32", icon: Users, color: "text-green-600", subtitle: "alumnos activos" },
        { title: "Próxima Clase", value: "2:00 PM", icon: Clock, color: "text-purple-600", subtitle: "siguiente turno" },
        { title: "Asistencia Hoy", value: "92%", icon: TrendingUp, color: "text-orange-600", subtitle: "asistencia del día" },
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

      // Configurar la membresía activa
      const membershipConfig = clientStats.membershipStatus === UserStatus.ACTIVE 
        ? { 
            value: "Activa", 
            icon: CheckCircle, 
            color: "text-green-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-200"
          }
        : { 
            value: "Inactiva", 
            icon: XCircle, 
            color: "text-red-600",
            bgColor: "bg-red-50",
            borderColor: "border-red-200"
          };

      return [
        { 
          title: "Actividad Semanal", 
          value: clientStats.weeklyActivityCount.toString(), 
          icon: Activity, 
          color: "text-blue-600",
          subtitle: "Entrenamientos de la semana"
        },
        { 
          title: "Próxima Clase", 
          value: nextClassValue, 
          icon: Clock, 
          color: "text-orange-600",
          subtitle: clientStats.nextClass?.name || "No programada"
        },
        { 
          title: "Entrenamientos completados", 
          value: clientStats.completedClassesCount.toString(), 
          icon: TrendingUp, 
          color: "text-purple-600",
          subtitle: "Total histórico"
        },
        { 
          title: "Membresía", 
          value: membershipConfig.value, 
          icon: membershipConfig.icon, 
          color: membershipConfig.color,
          subtitle: "Estado actual"
        },
      ]
    }
  }

  const getQuickActions = () => {
    if (user.role === UserRole.ADMIN) {
      return [
        { title: "Crear Actividad", href: "/activities/new", icon: Activity },
        { title: "Gestionar Clientes", href: "/clients", icon: Users },
        { title: "Ver Pagos", href: "/payments", icon: CreditCard },
        { title: "Ver Actividades", href: "/activities", icon: Calendar },
      ]
    } else if (user.role === UserRole.TRAINER) {
      return [
        { title: "Mis Actividades", href: "/activities", icon: Activity },
        { title: "Mis Clientes", href: "/clients", icon: Users },
        { title: "Ver Actividades", href: "/activities", icon: Calendar },
      ]
    } else {
      return [
        { title: "Ver Actividades", href: "/activities", icon: Activity },
        { title: "Mis Inscripciones", href: "/activities", icon: Calendar },
        { title: "Realizar Pago", href: "/payments/method-select", icon: CreditCard },
      ]
    }
  }

  const stats = getDashboardStats()
  const quickActions = getQuickActions()

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title={`Hola, ${user.firstName}`} />

      <div className="container-centered py-6 space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-primary to-orange-400 text-white">
          <CardHeader>
            <CardTitle>Bienvenido de vuelta</CardTitle>
            <CardDescription className="text-blue-100">
              {user.role === UserRole.ADMIN && "Panel de administración completo"}
              {user.role === UserRole.TRAINER && "Gestiona tus clases y clientes"}
              {user.role === UserRole.CLIENT && "Mantente activo con tus entrenamientos"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className={`${stat.color ? stat.color : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between h-20">
                  <div className="flex-1 flex flex-col justify-center h-full">
                    <p className="text-sm text-muted-foreground leading-tight">{stat.title}</p>
                    <p className="text-2xl font-bold leading-tight my-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {stat.subtitle || '\u00A0'}
                    </p>
                  </div>
                  <div className="flex items-center justify-center h-full">
                    <stat.icon className={`h-8 w-8 ${stat.color} flex-shrink-0`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col gap-2 bg-transparent">
                  <action.icon className="h-6 w-6" />
                  <span className="text-sm">{action.title}</span>
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nueva inscripción</p>
                <p className="text-xs text-muted-foreground">María se inscribió a Yoga Matutino</p>
              </div>
              <span className="text-xs text-muted-foreground">Hace 5 min</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Pago recibido</p>
                <p className="text-xs text-muted-foreground">Juan completó el pago de $150</p>
              </div>
              <span className="text-xs text-muted-foreground">Hace 15 min</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Clase completada</p>
                <p className="text-xs text-muted-foreground">CrossFit Avanzado - 12 asistentes</p>
              </div>
              <span className="text-xs text-muted-foreground">Hace 1 hora</span>
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
