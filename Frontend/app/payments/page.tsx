"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { MobileHeader } from "@/components/ui/mobile-header"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, CreditCard, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"

// Mock data
const mockPayments = [
  {
    id: "1",
    clientId: "1",
    clientName: "María González",
    activityId: "1",
    activityName: "Yoga Matutino",
    amount: 25,
    date: new Date("2024-01-14"),
    status: "completed" as const,
    method: "card" as const,
  },
  {
    id: "2",
    clientId: "2",
    clientName: "Juan Pérez",
    activityId: "2",
    activityName: "CrossFit Avanzado",
    amount: 35,
    date: new Date("2024-01-13"),
    status: "completed" as const,
    method: "cash" as const,
  },
  {
    id: "3",
    clientId: "3",
    clientName: "Ana Martín",
    activityId: "1",
    activityName: "Yoga Matutino",
    amount: 25,
    date: new Date("2024-01-15"),
    status: "pending" as const,
    method: "transfer" as const,
  },
]

export default function PaymentsPage() {
  const { user } = useAuth()
  const [payments] = useState(mockPayments)

  if (!user) return null

  const canManagePayments = user.role === "administrator" || user.role === "trainer"
  const userPayments = user.role === "client" ? payments.filter((payment) => payment.clientId === user.id) : payments

  const completedPayments = userPayments.filter((p) => p.status === "completed")
  const pendingPayments = userPayments.filter((p) => p.status === "pending")
  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado"
      case "pending":
        return "Pendiente"
      case "failed":
        return "Fallido"
      default:
        return status
    }
  }

  const getMethodText = (method: string) => {
    switch (method) {
      case "cash":
        return "Efectivo"
      case "card":
        return "Tarjeta"
      case "transfer":
        return "Transferencia"
      default:
        return method
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader
        title="Pagos"
        actions={
          user.role === "client" ? (
            <Link href="/payments/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Pagar
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="container py-6 space-y-6">
        {/* Stats */}
        {canManagePayments && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                    <p className="text-2xl font-bold">${totalRevenue}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Link href={"/payments/verify"}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                    <p className="text-2xl font-bold">{pendingPayments.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payments Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="completed">Completados</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {userPayments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{payment.activityName}</h3>
                      {canManagePayments && <p className="text-sm text-muted-foreground">{payment.clientName}</p>}
                    </div>
                    <Badge variant={getStatusColor(payment.status)}>{getStatusText(payment.status)}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{formatDate(payment.date)}</span>
                      <span className="text-muted-foreground">{getMethodText(payment.method)}</span>
                    </div>
                    <span className="font-bold text-lg">${payment.amount}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 mt-4">
            {completedPayments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{payment.activityName}</h3>
                      {canManagePayments && <p className="text-sm text-muted-foreground">{payment.clientName}</p>}
                    </div>
                    <Badge variant="default">Completado</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{formatDate(payment.date)}</span>
                      <span className="text-muted-foreground">{getMethodText(payment.method)}</span>
                    </div>
                    <span className="font-bold text-lg">${payment.amount}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {pendingPayments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{payment.activityName}</h3>
                      {canManagePayments && <p className="text-sm text-muted-foreground">{payment.clientName}</p>}
                    </div>
                    <Badge variant="secondary">Pendiente</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{formatDate(payment.date)}</span>
                      <span className="text-muted-foreground">{getMethodText(payment.method)}</span>
                    </div>
                    <span className="font-bold text-lg">${payment.amount}</span>
                  </div>

                  {user.role === "client" && (
                    <Button className="w-full" size="sm">
                      Completar Pago
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {userPayments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay pagos</h3>
              <p className="text-muted-foreground mb-4">
                {user.role === "client" ? "No tienes pagos registrados" : "No hay pagos en el sistema"}
              </p>
              {user.role === "client" && (
                <Link href="/payments/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Realizar Pago
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
