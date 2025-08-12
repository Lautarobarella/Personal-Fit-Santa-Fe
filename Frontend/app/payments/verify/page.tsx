"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Textarea } from "@/components/ui/textarea"
import { usePayment, usePendingPayments } from "@/hooks/use-payment"
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

  // NUEVO: Hook externo con la lista inicial de pendientes
  const { pendingPayments, loading, totalPendingPayments } = usePendingPayments(user?.id, true)
  const { updatePaymentStatus, fetchSinglePayment } = usePayment(user?.id, true)

  // Inicializa y congela la cantidad total de pagos al primer render
  const initialPendingCount = useRef<number | null>(null)
  useEffect(() => {
    // Solo setea cuando: no está cargando y nunca se seteo
    if (!loading && initialPendingCount.current === null) {
      initialPendingCount.current = pendingPayments.length
    }
  }, [loading, pendingPayments])

  const [currentPayment, setCurrentPayment] = useState<PaymentType | null>(null)
  useEffect(() => {
    const fetchPayment = async () => {
      const payment =
        pendingPayments[currentIndex]
          ? await fetchSinglePayment(pendingPayments[currentIndex].id)
          : null;
      setCurrentPayment(payment);
    };
    fetchPayment();
  }, [currentIndex, pendingPayments, fetchSinglePayment]);



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

  // // NUEVO: Mientras no se haya seteado el valor total, mostrar loader
  // if (loading && initialPendingCount.current === null) {
  //   return (
  //     <div className="min-h-screen bg-background flex flex-col items-center justify-center">
  //       <Loader2 className="h-8 w-8 animate-spin mb-2" />
  //       <p className="text-muted-foreground">Cargando pagos pendientes...</p>
  //     </div>
  //   )
  // }


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
      setTimeout(() => {
        setShow(true)
        setCurrentIndex((prev) => prev + 1)
        setReviewedCount((prev) => prev + 1)
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
        {/* Progress section - más compacto */}
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-medium">Progreso</span>
          <span className="text-muted-foreground">
            {reviewedCount} completados, {totalPendingPayments} totales
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-1 mb-2">
          <div
            className="bg-primary h-1 rounded-full transition-all duration-300"
            style={{
              width: (!initialPendingCount.current || reviewedCount === 0)
                ? "0%"
                : `${(reviewedCount / (initialPendingCount.current ?? 1)) * 100}%`
            }}
          />
        </div>

        <div className={`transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"} overflow-hidden`}>
          {/* Renderiza solo si hay currentPayment */}
          {currentPayment && (
            <>
               {/* Payment details card - más compacto */}
               <Card className="mb-2">
                <CardContent className="p-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium truncate">{currentPayment.clientName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{formatDateTime(currentPayment.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="font-bold">{currentPayment.amount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <Badge variant={getStatusColor(currentPayment.status)} className="text-xs px-1.5 py-0.5">
                        {getStatusText(currentPayment.status)}
                      </Badge>
                    </div>
                  </div>
                  {currentPayment.receiptUrl && (
                   <div className="mt-1 pt-1 border-t">
                      <span className="text-xs text-muted-foreground">
                        Comprobante: {formatDateTime(currentPayment.createdAt)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

               {/* Receipt section - priorizar tamaño */}
               <Card className="mb-2">
                 <CardContent className="p-2">
                   <Label className="text-sm font-medium mb-1 block">Comprobante de Pago</Label>
                   <div className="border rounded-lg overflow-hidden">
                    <img
                      src={currentPayment.receiptUrl || "/placeholder.svg"}
                      alt="Comprobante de pago"
                       className="w-full max-h-[280px] object-contain bg-gray-50 mx-auto"
                    />
                  </div>
                   <div className="mt-1 flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(currentPayment.receiptUrl!, "_blank")}
                      className="bg-transparent text-xs px-2 py-1 h-7"
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
                      className="bg-transparent text-xs px-2 py-1 h-7"
                    >
                      Descargar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Rejection reason - más compacto */}
           <Card className="mb-2">
             <CardContent className="p-2">
              <Label htmlFor="rejectionReason" className="text-sm">Razón del rechazo</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Explica por qué se rechaza el pago..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={1}
                className="resize-none text-xs mt-1"
                disabled={!currentPayment}
              />
            </CardContent>
          </Card>

          {/* Action buttons - más compactos */}
           <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => handleStatusUpdate("rejected")}
              disabled={isVerifying || !currentPayment || loading || pendingPayments.length === 0}
               className="w-1/2 py-2 text-sm font-semibold h-9"
            >
              {isVerifying && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {!isVerifying && <X className="mr-1 h-3 w-3" />}
              Rechazar
            </Button>
            <Button
              variant="default"
              onClick={() => handleStatusUpdate("paid")}
              disabled={isVerifying || !currentPayment || loading || pendingPayments.length === 0}
               className="w-1/2 py-2 text-sm font-semibold h-9"
            >
              {isVerifying && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {!isVerifying && <Check className="mr-1 h-3 w-3" />}
              Aprobar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
