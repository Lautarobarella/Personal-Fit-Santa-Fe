"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { MobileHeader } from "@/components/ui/mobile-header"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, CreditCard, Calendar, DollarSign } from "lucide-react"
import { PaymentVerificationDialog } from "@/components/payments/payment-verification-dialog"
import { usePayment } from "@/hooks/use-payment"

export default function PaymentsVerifyPage() {
  const { user } = useAuth()
  const {
    payments,
    loading,
    error,
    loadPayments,
    updatePaymentStatus,
    loadPaymentDetail,
  } = usePayment()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingPayments, setPendingPayments] = useState([])

  useEffect(() => {
    if (user?.role === "admin") {
      loadPayments()
    }
  }, [user, loadPayments])

  useEffect(() => {
    if (payments && payments.length > 0) {
      const pendings = payments.filter((p) => p.status === "pending")
      setPendingPayments(pendings)
      setCurrentIndex(0)
      setDialogOpen(pendings.length > 0)
    }
  }, [payments])

  if (!user || user.role !== "admin") return <div>No tienes permisos para ver esta página</div>
  if (loading) return <div>Cargando pagos...</div>
  if (error) return <div>{error}</div>
  if (!pendingPayments.length) return <div>No hay pagos pendientes por verificar.</div>

  const currentPayment = pendingPayments[currentIndex]

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Verificar Pagos" />
      <div className="container py-6 space-y-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendientes por verificar</p>
              <p className="text-2xl font-bold">{pendingPayments.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>
        {/* Dialog para verificación */}
        {dialogOpen && currentPayment && (
          <PaymentVerificationDialog
            open={dialogOpen}
            onOpenChange={(open) => setDialogOpen(open)}
            paymentId={currentPayment.id}
          />
        )}
        {/* Puedes mostrar aquí una lista de pagos pendientes si lo deseas */}
      </div>
      <BottomNav />
    </div>
  )
}