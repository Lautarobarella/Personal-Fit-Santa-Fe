"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, CreditCard, DollarSign, TrendingUp, Plus } from "lucide-react"

// Mock data
const mockClient = {
  id: "1",
  name: "María González",
}

const mockPayments = [
  {
    id: "1",
    activityId: "1",
    activityName: "Yoga Matutino",
    amount: 25,
    date: new Date("2024-01-14"),
    dueDate: new Date("2024-01-15"),
    status: "completed",
    method: "card",
    reference: "PAY-001",
  },
  {
    id: "2",
    activityId: "2",
    activityName: "CrossFit Avanzado",
    amount: 35,
    date: new Date("2024-01-11"),
    dueDate: new Date("2024-01-12"),
    status: "completed",
    method: "cash",
    reference: "PAY-002",
  },
  {
    id: "3",
    activityId: "3",
    activityName: "Pilates Intermedio",
    amount: 30,
    date: new Date("2024-01-15"),
    dueDate: new Date("2024-01-16"),
    status: "pending",
    method: "transfer",
    reference: "PAY-003",
  },
  {
    id: "4",
    activityId: "4",
    activityName: "Zumba",
    amount: 20,
    date: new Date("2024-01-08"),
    dueDate: new Date("2024-01-09"),
    status: "completed",
    method: "card",
    reference: "PAY-004",
  },
  {
    id: "5",
    activityId: "5",
    activityName: "Spinning",
    amount: 30,
    date: new Date("2024-01-05"),
    dueDate: new Date("2024-01-06"),
    status: "overdue",
    method: "transfer",
    reference: "PAY-005",
  },
]

export default function ClientPaymentsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [client] = useState(mockClient)
  const [payments] = useState(mockPayments)

  if (!user || (user.role !== "admin" && user.role !== "trainer")) {
    return <div>No tienes permisos para ver esta información</div>
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  const completedPayments = payments.filter((p) => p.status === "completed")
  const pendingPayments = payments.filter((p) => p.status === "pending")
  const overduePayments = payments.filter((p) => p.status === "overdue")

  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "overdue":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Pagado"
      case "pending":
        return "Pendiente"
      case "overdue":
        return "Vencido"
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
    <div className="min-h-screen bg-background">
      <MobileHeader
        title={`Pagos - ${client.name}`}
        showBack
        onBack={() => router.back()}
        actions={
          user.role === "admin" ? (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          ) : null
        }
      />

      <div className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pagado</p>
                  <p className="text-2xl font-bold text-green-600">${totalPaid}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendiente</p>
                  <p className="text-2xl font-bold text-orange-600">${totalPending + totalOverdue}</p>
                </div>
                <CreditCard className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-blue-600">{payments.length}</div>
              <div className="text-sm text-muted-foreground">Total Pagos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-green-600">{completedPayments.length}</div>
              <div className="text-sm text-muted-foreground">Completados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-red-600">{overduePayments.length}</div>
              <div className="text-sm text-muted-foreground">Vencidos</div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="completed">Pagados</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="overdue">Vencidos</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{payment.activityName}</h3>
                      <p className="text-sm text-muted-foreground">Ref: {payment.reference}</p>
                    </div>
                    <Badge variant={getStatusColor(payment.status)}>{getStatusText(payment.status)}</Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {payment.status === "completed"
                              ? `Pagado: ${formatDate(payment.date)}`
                              : `Vence: ${formatDate(payment.dueDate)}`}
                          </span>
                        </div>
                        <span className="capitalize">{getMethodText(payment.method)}</span>
                      </div>
                      <span className="font-bold text-lg">${payment.amount}</span>
                    </div>
                  </div>

                  {payment.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Ver Detalles
                      </Button>
                      <Button size="sm" className="flex-1">
                        Marcar como Pagado
                      </Button>
                    </div>
                  )}

                  {payment.status === "overdue" && (
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Enviar Recordatorio
                      </Button>
                      <Button size="sm" className="flex-1">
                        Marcar como Pagado
                      </Button>
                    </div>
                  )}
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
                      <p className="text-sm text-muted-foreground">Ref: {payment.reference}</p>
                    </div>
                    <Badge variant="default">Pagado</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Pagado: {formatDate(payment.date)}</span>
                      </div>
                      <span className="capitalize">{getMethodText(payment.method)}</span>
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
                      <p className="text-sm text-muted-foreground">Ref: {payment.reference}</p>
                    </div>
                    <Badge variant="secondary">Pendiente</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Vence: {formatDate(payment.dueDate)}</span>
                      </div>
                      <span className="capitalize">{getMethodText(payment.method)}</span>
                    </div>
                    <span className="font-bold text-lg">${payment.amount}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      Ver Detalles
                    </Button>
                    <Button size="sm" className="flex-1">
                      Marcar como Pagado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {pendingPayments.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay pagos pendientes</h3>
                  <p className="text-muted-foreground">Todos los pagos están al día</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-3 mt-4">
            {overduePayments.map((payment) => (
              <Card key={payment.id} className="border-destructive">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{payment.activityName}</h3>
                      <p className="text-sm text-muted-foreground">Ref: {payment.reference}</p>
                    </div>
                    <Badge variant="destructive">Vencido</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-destructive">Venció: {formatDate(payment.dueDate)}</span>
                      </div>
                      <span className="capitalize">{getMethodText(payment.method)}</span>
                    </div>
                    <span className="font-bold text-lg text-destructive">${payment.amount}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      Enviar Recordatorio
                    </Button>
                    <Button size="sm" className="flex-1">
                      Marcar como Pagado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {overduePayments.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-green-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">¡Excelente!</h3>
                  <p className="text-muted-foreground">No hay pagos vencidos</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
