"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { MobileHeader } from "@/components/ui/mobile-header"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Calendar, DollarSign, FileCheck, User, Eye, AlertCircle } from "lucide-react"
import { CreatePaymentDialog } from "@/components/payments/create-payment-dialog"
import { PaymentVerificationDialog } from "@/components/payments/payment-verification-dialog"
import { mockUsers } from "@/mocks/mockUsers"
import { mockPayments } from "@/mocks/mockPayments"

export default function PaymentsPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState(mockPayments)
  const [searchTerm, setSearchTerm] = useState("")
  const [verificationDialog, setVerificationDialog] = useState<{
    open: boolean
    payment: (typeof mockPayments)[0] | null
  }>({ open: false, payment: null })
  const [createPaymentDialog, setCreatePaymentDialog] = useState(false)

  if (!user) return null

  // Only administrators can access payments
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <MobileHeader title="Pagos" />
        <div className="container py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">Solo los administradores pueden acceder a la gestión de pagos.</p>
        </div>
        <BottomNav />
      </div>
    )
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
    return new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
    }).format(date)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pagado":
        return "success"
      case "pendiente":
        return "warning"
      case "rechazado":
        return "destructive"
      case "vencido":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pagado":
        return "Pagado"
      case "pendiente":
        return "Pendiente"
      case "rechazado":
        return "Rechazado"
      case "vencido":
        return "Vencido"
      default:
        return status
    }
  }

  const filteredPayments = payments.filter(
    (payment) =>
      payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatMonth(payment.month).toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const paidPayments = filteredPayments.filter((p) => p.status === "pagado")
  const pendingPayments = filteredPayments.filter((p) => p.status === "pendiente")
  const rejectedPayments = filteredPayments.filter((p) => p.status === "rechazado")
  const overduePayments = filteredPayments.filter((p) => p.status === "vencido")

  const pendingVerification = pendingPayments.filter((p) => p.receiptUrl)

  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0)

  const handleVerifyPayment = async (paymentId: string, status: "pagado" | "rechazado", reason?: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleCreatePayment = async (paymentData: {
    clientId: string
    month: string
    amount: number
    dueDate: Date
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const client = mockUsers.find((c) => c.id === paymentData.clientId)
    if (!client) return

    const newPayment = {
      id: Date.now().toString(),
      clientId: paymentData.clientId,
      clientName: client.name,
      month: paymentData.month,
      amount: paymentData.amount,
      dueDate: paymentData.dueDate,
      status: "pendiente" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setPayments((prev) => [newPayment, ...prev])
  }

  const handleVerificationClick = (payment: (typeof mockPayments)[0]) => {
    setVerificationDialog({ open: true, payment })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader
        title="Pagos"
        actions={
          <div className="flex">
          {user.role === "admin" ? (
            <Button size="sm" variant="outline" className="bg-transparent">
              <FileCheck className="h-4 w-4 mr-1" />
              Verificar ({pendingVerification.length})
            </Button>
          ) : user.role === "client" ? (
            <Button size="sm" onClick={() => setCreatePaymentDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          ) : null}
          </div>
        }
      />

      <div className="container py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o mes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
                  <p className="text-2xl font-bold text-success">${totalRevenue}</p>
                </div>
                <DollarSign className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Por Verificar</p>
                  <p className="text-2xl font-bold text-warning">{pendingVerification.length}</p>
                </div>
                <FileCheck className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="paid">Pagados</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="rejected">Rechazados</TabsTrigger>
            <TabsTrigger value="overdue">Vencidos</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {filteredPayments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">{payment.clientName}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatMonth(payment.month)}</span>
                        <span>•</span>
                        <span>Vence: {formatDate(payment.dueDate)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">${payment.amount}</div>
                      <Badge variant={getStatusColor(payment.status)} className="text-xs">
                        {getStatusText(payment.status)}
                      </Badge>
                    </div>
                  </div>

                  {payment.receiptUrl && payment.status === "pendiente" && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleVerificationClick(payment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Verificar Comprobante
                      </Button>
                    </div>
                  )}

                  {payment.status === "rechazado" && payment.rejectionReason && (
                    <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                      <strong>Rechazado:</strong> {payment.rejectionReason}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="paid" className="space-y-3 mt-4">
            {paidPayments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">{payment.clientName}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatMonth(payment.month)}</span>
                        {payment.verifiedAt && (
                          <>
                            <span>•</span>
                            <span>Verificado: {formatDate(payment.verifiedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-success">${payment.amount}</div>
                      <Badge variant="success" className="text-xs">
                        Pagado
                      </Badge>
                    </div>
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
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">{payment.clientName}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatMonth(payment.month)}</span>
                        <span>•</span>
                        <span>Vence: {formatDate(payment.dueDate)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">${payment.amount}</div>
                      <Badge variant="warning" className="text-xs">
                        Pendiente
                      </Badge>
                    </div>
                  </div>

                  {payment.receiptUrl && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleVerificationClick(payment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Verificar Comprobante
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-3 mt-4">
            {rejectedPayments.map((payment) => (
              <Card key={payment.id} className="border-destructive">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">{payment.clientName}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatMonth(payment.month)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-destructive">${payment.amount}</div>
                      <Badge variant="destructive" className="text-xs">
                        Rechazado
                      </Badge>
                    </div>
                  </div>

                  {payment.rejectionReason && (
                    <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                      <strong>Razón:</strong> {payment.rejectionReason}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-3 mt-4">
            {overduePayments.map((payment) => (
              <Card key={payment.id} className="border-destructive">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">{payment.clientName}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatMonth(payment.month)}</span>
                        <span>•</span>
                        <span className="text-destructive">Venció: {formatDate(payment.dueDate)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-destructive">${payment.amount}</div>
                      <Badge variant="destructive" className="text-xs">
                        Vencido
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {verificationDialog.payment && (
        <PaymentVerificationDialog
          open={verificationDialog.open}
          onOpenChange={(open) => setVerificationDialog({ open, payment: null })}
          payment={verificationDialog.payment}
          onVerify={handleVerifyPayment}
        />
      )}

      <CreatePaymentDialog
        open={createPaymentDialog}
        onOpenChange={setCreatePaymentDialog}
        clients={mockUsers}
        onCreatePayment={handleCreatePayment}
      />

      <BottomNav />
    </div>
  )
}
