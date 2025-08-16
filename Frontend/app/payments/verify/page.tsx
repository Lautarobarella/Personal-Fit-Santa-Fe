"use client"

import { PaymentReceiptDisplay } from "@/components/payments/payment-receipt-display"
import { useAuth } from "@/components/providers/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Textarea } from "@/components/ui/textarea"
import { usePayment } from "@/hooks/use-payment"
import { usePendingPayments } from "@/hooks/use-pending-payments"
import { useToast } from "@/hooks/use-toast"
import { PaymentStatus, PaymentType, UserRole } from "@/lib/types"
import { Calendar, Check, Clock, DollarSign, Loader2, User, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

export default function PaymentVerificationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [show, setShow] = useState(true)
  const [reviewedCount, setReviewedCount] = useState(0)

  // Hook separado para pagos pendientes
  const { pendingPayments, loading, totalPendingPayments } = usePendingPayments(user?.id, true)
  const { updatePaymentStatus, fetchSinglePayment } = usePayment(user?.id, true)

  // Inicializa y congela la cantidad total de pagos al primer render
  const initialPendingCount = useRef<number | null>(null)
  useEffect(() => {
    // Solo setea cuando: no está cargando y nunca se seteo
    if (!loading && initialPendingCount.current === null) {
      initialPendingCount.current = totalPendingPayments
    }
  }, [loading, totalPendingPayments])

  const [currentPayment, setCurrentPayment] = useState<PaymentType | null>(null)

  // Cargar el pago actual cuando cambie el índice o la lista de pendientes
  useEffect(() => {
    if (pendingPayments.length > 0 && currentIndex < pendingPayments.length) {
      const fetchPayment = async () => {
        try {
          const payment = await fetchSinglePayment(pendingPayments[currentIndex].id)
          setCurrentPayment(payment)
        } catch (error) {
          console.error("Error al cargar el pago:", error)
          // Si falla la carga, intentar con el siguiente
          if (currentIndex + 1 < pendingPayments.length) {
            setCurrentIndex(prev => prev + 1)
          }
        }
      }
      fetchPayment()
    } else if (pendingPayments.length === 0) {
      setCurrentPayment(null)
    }
  }, [currentIndex, pendingPayments, fetchSinglePayment])

  // Redirige si no es admin
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      router.replace("/payments")
    }
  }, [user, router])

  // Salir al finalizar
  if (
    !loading &&
    initialPendingCount.current !== null &&
    reviewedCount >= initialPendingCount.current &&
    initialPendingCount.current > 0
  ) {
    setTimeout(() => router.replace("/payments"), 2000)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Check className="h-16 w-16 text-success mb-4" />
        <h2 className="text-2xl font-bold mb-2">¡Verificación Completada!</h2>
        <p className="text-muted-foreground mb-6">Has verificado {initialPendingCount.current} pagos exitosamente.</p>
        <Button onClick={() => router.replace("/payments")}>Volver a Pagos</Button>
      </div>
    )
  }

  if (
    !loading &&
    initialPendingCount.current === 0
  ) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Check className="h-16 w-16 text-success mb-4" />
        <h2 className="text-2xl font-bold mb-2">No hay pagos pendientes</h2>
        <Button onClick={() => router.replace("/payments")}>Volver a Pagos</Button>
      </div>
    )
  }

  // Estado de carga
  if (loading || !user || user.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-muted-foreground">Cargando pagos pendientes...</p>
      </div>
    )
  }

  // Helper visual
  const formatDateTime = (date: Date | string | null) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date ?? "N/A"))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case PaymentStatus.PAID: return "success"
      case PaymentStatus.REJECTED: return "destructive"
      case PaymentStatus.PENDING: return "warning"
      default: return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case PaymentStatus.PAID: return "Pagado"
      case PaymentStatus.REJECTED: return "Rechazado"
      case PaymentStatus.PENDING: return "Pendiente"
      default: return status
    }
  }

  // Acción de aprobar/rechazar
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

      setRejectionReason("")
      setShow(false)

      // Esperar a que se complete la transición visual antes de cambiar el índice
      setTimeout(() => {
        setShow(true)
        // Avanzar al siguiente pago solo si hay más
        if (currentIndex + 1 < pendingPayments.length) {
          setCurrentIndex(prev => prev + 1)
        }
        setReviewedCount(prev => prev + 1)
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

  // Render principal
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <MobileHeader
        title="Verificar Pagos"
        showBack
        onBack={() => router.replace("/payments")}
      />

      <div className="flex-1 overflow-hidden px-3 py-2">
        {/* Progress section */}
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="font-medium">Progreso</span>
          <span className="text-muted-foreground">
            {reviewedCount} completados, {totalPendingPayments} totales
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 mb-2">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{
              width: (!initialPendingCount.current || reviewedCount === 0)
                ? "0%"
                : `${(reviewedCount / (initialPendingCount.current ?? 1)) * 100}%`
            }}
          />
        </div>

        <div className={`transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"} space-y-2`}>
          {/* Renderiza solo si hay currentPayment */}
          {currentPayment && (
            <>
              {/* Payment details card */}
              <Card className="mb-2">
                <CardContent className="p-2.5">
                  <div className="grid grid-cols-2 gap-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium truncate">{currentPayment.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{formatDateTime(currentPayment.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">{currentPayment.amount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Badge variant={getStatusColor(currentPayment.status)} className="text-sm px-2 py-1">
                        {getStatusText(currentPayment.status)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Receipt section */}
              <Card className="mb-2">
                <CardContent className="p-2.5">
                  <Label className="text-sm font-medium mb-1.5 block">Comprobante de Pago</Label>
                  <PaymentReceiptDisplay
                    fileId={currentPayment.receiptId}
                    fileName={`comprobante-${currentPayment.clientName}-${currentPayment.id}`}
                    className="h-72"
                    showActions={false}
                  />
                  <div className="mt-1.5 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fileId = currentPayment.receiptId;
                        if (fileId) {
                          window.open(`/payments/files/${fileId}`, "_blank");
                        }
                      }}
                      className="bg-transparent text-sm px-2.5 py-1.5 h-8"
                      disabled={!currentPayment.receiptId}
                    >
                      Ver completo
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
                      className="bg-transparent text-sm px-2.5 py-1.5 h-8"
                      disabled={!currentPayment.receiptUrl}
                    >
                      Descargar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Rejection reason */}
          <Card className="mb-2">
            <CardContent className="p-2.5">
              <Label htmlFor="rejectionReason" className="text-sm font-medium">Razón del rechazo</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Explica por qué se rechaza el pago..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                className="resize-none text-sm mt-1.5"
                disabled={!currentPayment}
              />
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-2 mt-2 mb-3">
            <Button
              variant="secondary"
              onClick={() => handleStatusUpdate("rejected")}
              disabled={isVerifying || !currentPayment || loading || pendingPayments.length === 0}
              className="w-1/2 py-2 text-sm font-semibold h-9"
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isVerifying && <X className="mr-2 h-4 w-4" />}
              Rechazar
            </Button>
            <Button
              variant="default"
              onClick={() => handleStatusUpdate("paid")}
              disabled={isVerifying || !currentPayment || loading || pendingPayments.length === 0}
              className="w-1/2 py-2 text-sm font-semibold h-9"
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isVerifying && <Check className="mr-2 h-4 w-4" />}
              Aprobar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
