"use client"

import { PaymentVerificationDialog } from "@/components/payments/payment-verification-dialog"
import { useAuth } from "@/components/providers/auth-provider"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePayment } from "@/hooks/use-payment"
import { Calendar, DollarSign, Eye, FileCheck, Plus, Search, Upload, User } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function PaymentsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [verificationDialog, setVerificationDialog] = useState<{
    open: boolean
    paymentId: number | null
  }>({ open: false, paymentId: null })
  const {
    payments,
    loading,
    error,
    loadPayments,
    loadPaymentsById,
  } = usePayment()

  useEffect(() => {
    if (user?.role === "admin") {
      loadPayments()
    }
    else if (user?.role === "client") {
      loadPaymentsById(user.id)
    }
  }, [loadPayments, user, loadPaymentsById])

  if (!user) return null

  // // Only administrators can access payments
  // if (user.role !== "admin") {
  //   return (
  //     <div className="min-h-screen bg-background pb-20">
  //       <MobileHeader title="Pagos" />
  //       <div className="container py-12 text-center">
  //         <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
  //         <h3 className="text-lg font-medium mb-2">Acceso Restringido</h3>
  //         <p className="text-muted-foreground">Solo los administradores pueden acceder a la gestión de pagos.</p>
  //       </div>
  //       <BottomNav />
  //     </div>
  //   )
  // }

  const formatMonth = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
    }).format(new Date(date))
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "success"
      case "pending":
        return "warning"
      case "rejected":
        return "destructive"
      case "debtor":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pagado"
      case "pending":
        return "Pendiente"
      case "rejected":
        return "Rechazado"
      case "debtor":
        return "Vencido"
      default:
        return status
    }
  }

  const filteredPayments = payments.filter(
    (p) =>
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(p.createdAt).toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const paidPayments = filteredPayments.filter((p) => p.status === "paid")
  const pendingPayments = filteredPayments.filter((p) => p.status === "pending")
  const rejectedPayments = filteredPayments.filter((p) => p.status === "rejected")
  const overduePayments = filteredPayments.filter((p) => p.status === "debtor")

  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0)


  const handleVerificationClick = (id: number) => {
    setVerificationDialog({ open: true, paymentId: id })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader
        title="Pagos"
        actions={
          <div className="flex gap-x-2">
            {user.role === "admin" ? (
              <>
                <Link href="/payments/verify">
                  <Button size="sm" variant="outline" className="bg-transparent">
                    <FileCheck className="h-4 w-4" />
                    ({pendingPayments.length})
                  </Button>
                </Link>
                <Link href="/payments/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    Nuevo
                  </Button>
                </Link>
              </>
            ) : user.role === "client" ? (
              <Link href="/payments/new">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Nuevo
                </Button>
              </Link>
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
        {user.role === "admin" && (
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
                    <p className="text-2xl font-bold text-warning">{pendingPayments.length}</p>
                  </div>
                  <FileCheck className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payments Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {filteredPayments.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">{p.clientName}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(p.createdAt)}</span>
                        <span>•</span>
                        <span>Vence: {formatDate(p.expiresAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">${p.amount}</div>
                      <Badge variant={getStatusColor(p.status)} className="text-xs">
                        {getStatusText(p.status)}
                      </Badge>
                    </div>
                  </div>

                  {p.rejectionReason && (
                    <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                      <strong>Razón:</strong> {p.rejectionReason}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {pendingPayments.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">{p.clientName}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatMonth(p.createdAt)}</span>
                        <span>•</span>
                        <span>Vence: {formatDate(p.expiresAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">${p.amount}</div>
                      <Badge variant="warning" className="text-xs">
                        Pendiente
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => handleVerificationClick(p.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Verificar Comprobante
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {verificationDialog.paymentId !== null && (
        <PaymentVerificationDialog
          open={verificationDialog.open}
          onOpenChange={(open) =>
            setVerificationDialog({ open, paymentId: null })
          }
          paymentId={verificationDialog.paymentId}
        />
      )}

      <BottomNav />
    </div>
  )
}
