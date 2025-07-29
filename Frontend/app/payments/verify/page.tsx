"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Textarea } from "@/components/ui/textarea"
import { usePayment } from "@/hooks/use-payment"
import { useToast } from "@/hooks/use-toast"
import { useCurrentPayment } from "@/hooks/use-current-payment"
import { ArrowLeft, Calendar, Check, Clock, DollarSign, Loader2, User, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function PaymentVerificationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [show, setShow] = useState(true)
  const [completedCount, setCompletedCount] = useState(0)

  const { payments, updatePaymentStatus, isLoading } = usePayment(user?.id, true)

  const pendingPayments = useMemo(() => payments.filter(p => p.status === "pending"), [payments])

  const { currentPayment, isPaymentLoading, reloadCurrentPayment } = useCurrentPayment(pendingPayments, currentIndex)

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/payments")
    }
  }, [user, router])

  if (!user || user.role !== "admin") return null

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "success"
      case "rejected":
        return "destructive"
      case "pending":
        return "warning"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pagado"
      case "rejected":
        return "Rechazado"
      case "pending":
        return "Pendiente"
      default:
        return status
    }
  }

  const handleStatusUpdate = async (status: "paid" | "rejected") => {
    if (!currentPayment) return

    if (status === "rejected" && !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar una razón para rechazar el pago",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    try {
      await updatePaymentStatus({
        id: currentPayment.id,
        status,
        rejectionReason: status === "rejected" ? rejectionReason : undefined,
      })

      toast({
        title: status === "paid" ? "Pago aprobado" : "Pago rechazado",
        description: `El pago de ${currentPayment.clientName} ha sido ${status === "paid" ? "aprobado" : "rechazado"}`,
      })

      setCompletedCount((prev) => prev + 1)
      setRejectionReason("")
      setShow(false)
      setTimeout(() => {
        setShow(true)
        setCurrentIndex((prev) => prev + 1)
      }, 350)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la verificación",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  if (!isLoading && pendingPayments.length > 0 && currentIndex >= pendingPayments.length) {
    setTimeout(() => router.push("/payments"), 2000)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Check className="h-16 w-16 text-success mb-4" />
        <h2 className="text-2xl font-bold mb-2">¡Verificación Completada!</h2>
        <p className="text-muted-foreground mb-6">Has verificado {completedCount} pagos exitosamente.</p>
        <Button onClick={() => router.push("/payments")}>Volver a Pagos</Button>
      </div>
    )
  }

  if (isLoading || isPaymentLoading || !currentPayment) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-muted-foreground">Cargando pagos pendientes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader
        title="Verificar Pagos"
        showBack
        onBack={() => router.push("/payments")}
        actions={
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} de {pendingPayments.length}
          </div>
        }
      />

      <div className="container py-6 space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso de Verificación</span>
              <span className="text-sm text-muted-foreground">
                {completedCount} completados, {pendingPayments.length - currentIndex} restantes
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentIndex / pendingPayments.length) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <div className={`transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{currentPayment.clientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateTime(currentPayment.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold text-lg">${currentPayment.amount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={getStatusColor(currentPayment.status)}>{getStatusText(currentPayment.status)}</Badge>
                </div>
              </div>
              {currentPayment.receiptUrl && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    Comprobante subido: {formatDateTime(currentPayment.createdAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium mb-2 block">Comprobante de Pago</Label>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={currentPayment.receiptUrl || "/placeholder.svg"}
                  alt="Comprobante de pago"
                  className="w-full max-h-[400px] object-contain bg-gray-50 mx-auto"
                />
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(currentPayment.receiptUrl!, "_blank")}
                  className="bg-transparent"
                >
                  Ver en tamaño completo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement("a")
                    link.href = currentPayment.receiptUrl!
                    link.download = `comprobante-${currentPayment.clientName}-${currentPayment.createdAt}.jpg`
                    link.click()
                  }}
                  className="bg-transparent"
                >
                  Descargar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Label htmlFor="rejectionReason">
                Razón del rechazo
              </Label>
              <Textarea
                id="rejectionReason"
                placeholder="Explica por qué se rechaza el pago..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex gap-3 sticky bottom-6">
            <Button
              variant="destructive"
              onClick={() => handleStatusUpdate("rejected")}
              disabled={isVerifying}
              className="flex-1"
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <X className="mr-2 h-4 w-4" />
              Rechazar
            </Button>
            <Button
              onClick={() => handleStatusUpdate("paid")}
              disabled={isVerifying}
              className="flex-1"
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Check className="mr-2 h-4 w-4" />
              Aprobar
            </Button>
          </div>
        </div>

        {currentIndex < pendingPayments.length - 1 && (
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span>
                  Siguiente: {pendingPayments[currentIndex + 1]?.clientName} -{" "}
                  {formatDateTime(pendingPayments[currentIndex + 1]?.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
