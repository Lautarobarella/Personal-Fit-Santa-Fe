"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Activity, Calendar, Clock, CreditCard, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  const getDashboardStats = () => {
    if (user.role === "admin") {
      return [
        { title: "Total Actividades", value: "24", icon: Activity, color: "text-blue-600" },
        { title: "Clientes Activos", value: "156", icon: Users, color: "text-green-600" },
        { title: "Ingresos del Mes", value: "$12,450", icon: CreditCard, color: "text-purple-600" },
        { title: "Asistencia Promedio", value: "87%", icon: TrendingUp, color: "text-orange-600" },
      ]
    } else if (user.role === "trainer") {
      return [
        { title: "Mis Actividades", value: "8", icon: Activity, color: "text-blue-600" },
        { title: "Mis Clientes", value: "32", icon: Users, color: "text-green-600" },
        { title: "Próxima Clase", value: "2:00 PM", icon: Clock, color: "text-purple-600" },
        { title: "Asistencia Hoy", value: "92%", icon: TrendingUp, color: "text-orange-600" },
      ]
    } else {
      return [
        { title: "Actividades Inscritas", value: "5", icon: Activity, color: "text-blue-600" },
        { title: "Próxima Clase", value: "10:00 AM", icon: Clock, color: "text-green-600" },
        { title: "Clases Completadas", value: "23", icon: TrendingUp, color: "text-purple-600" },
        { title: "Pagos Pendientes", value: "1", icon: CreditCard, color: "text-orange-600" },
      ]
    }
  }

  const getQuickActions = () => {
    if (user.role === "admin") {
      return [
        { title: "Crear Actividad", href: "/activities/new", icon: Activity },
        { title: "Gestionar Clientes", href: "/clients", icon: Users },
        { title: "Ver Pagos", href: "/payments", icon: CreditCard },
        { title: "Asistencias", href: "/attendance", icon: Calendar },
      ]
    } else if (user.role === "trainer") {
      return [
        { title: "Mis Actividades", href: "/activities", icon: Activity },
        { title: "Mis Clientes", href: "/clients", icon: Users },
        { title: "Tomar Asistencia", href: "/attendance", icon: Calendar },
      ]
    } else {
      return [
        { title: "Ver Actividades", href: "/activities", icon: Activity },
        { title: "Mis Inscripciones", href: "/enrollments", icon: Calendar },
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
              {user.role === "admin" && "Panel de administración completo"}
              {user.role === "trainer" && "Gestiona tus clases y clientes"}
              {user.role === "client" && "Mantente activo con tus entrenamientos"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
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
