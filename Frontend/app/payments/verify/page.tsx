"use client"

import { PaymentReceiptDisplay } from "@/components/payments/payment-receipt-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Textarea } from "@/components/ui/textarea"
import { usePaymentVerify } from "@/hooks/payments/use-payment-verify"
import { MethodType, UserRole } from "@/types"
import { Calendar, Check, Clock, DollarSign, Loader2, User, X } from "lucide-react"

export default function PaymentVerificationPage() {
  const {
    user,
    router,
    isVerifying,
    rejectionReason,
    setRejectionReason,
    show,
    reviewedCount,
    isOnCooldown,
    paymentQueue,
    currentPayment,
    initialPendingCount,
    loading,
    pendingPayments,
    isVerificationComplete,
    formatDateTime,
    getStatusColor,
    getStatusText,
    handleStatusUpdate,
  } = usePaymentVerify()

  if (isVerificationComplete) {
    const hasReviewedPayments = reviewedCount > 0
    const title = hasReviewedPayments ? "¡Verificación Completada!" : "No hay pagos pendientes"
    const message = hasReviewedPayments 
      ? `Has verificado ${reviewedCount} pagos exitosamente.`
      : undefined

    setTimeout(() => router.replace("/payments"), 2000)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Check className="h-16 w-16 text-success mb-4" />
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {message && <p className="text-muted-foreground mb-6">{message}</p>}
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

  // Render principal
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader
        title="Verificar Pagos"
        showBack
        onBack={() => router.replace("/payments")}
      />

      {/* Progress section - Fixed */}
      <div className="flex-shrink-0 px-3 py-2">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="font-medium">Progreso</span>
          <span className="text-muted-foreground">
            {reviewedCount} completados, {paymentQueue.length} pendientes
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 mb-2">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{
              width: initialPendingCount.current 
                ? `${(reviewedCount / initialPendingCount.current) * 100}%`
                : "0%"
            }}
          />
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 px-3 pb-safe">
        <div className={`transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"} space-y-2 pb-24`}>
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

              {/* Associated Users card - Solo mostrar si hay múltiples usuarios */}
              {currentPayment.associatedUsers && currentPayment.associatedUsers.length > 1 && (
                <Card className="mb-2">
                  <CardContent className="p-2.5">
                    <Label className="text-sm font-medium mb-1.5 block">Clientes Relacionados ({currentPayment.associatedUsers.length})</Label>
                    <div className="space-y-1">
                      {currentPayment.associatedUsers.map((user: any, index: number) => (
                        <div key={user.userId} className="flex items-center gap-2 text-sm py-1 px-2 bg-muted/50 rounded">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{user.userName}</span>
                          <span className="text-muted-foreground">({user.userDni})</span>
                          {index === 0 && (
                            <Badge variant="outline" className="text-xs ml-auto">Creador</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notas del pago - Mostrar siempre si existen, más prominente para efectivo */}
              {currentPayment.notes && (
                <Card className="mb-2">
                  <CardContent className="p-2.5">
                    <Label className="text-sm font-medium mb-1.5 block">
                      {currentPayment.method === MethodType.CASH ? "Detalles del Pago en Efectivo" : "Notas del Pago"}
                    </Label>
                    <div className={`p-2 rounded text-sm ${
                      currentPayment.method === MethodType.CASH 
                        ? "bg-amber-50 border border-amber-200 text-amber-800" 
                        : "bg-muted/50"
                    }`}>
                      {currentPayment.notes}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Receipt section - Solo para métodos que NO sean efectivo */}
              {currentPayment.method !== MethodType.CASH && (
                <Card className="mb-2">
                  <CardContent className="p-2.5">
                    <Label className="text-sm font-medium mb-1.5 block">Comprobante de Pago</Label>
                    <PaymentReceiptDisplay
                      fileId={currentPayment.receiptId}
                      fileName={`comprobante-${currentPayment.clientName}-${currentPayment.id}`}
                      className=""
                      showActions={true}
                      pdfHeight="280px"
                      imageHeight="280px"
                    />
                  </CardContent>
                </Card>
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

              {/* Action buttons - now in normal flow */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={isVerifying || isOnCooldown || !currentPayment || loading || pendingPayments.length === 0}
                  className="w-1/2 py-2 text-sm font-semibold h-9"
                >
                  {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {!isVerifying && <X className="mr-2 h-4 w-4" />}
                  {isOnCooldown ? "Espera..." : "Rechazar"}
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleStatusUpdate("paid")}
                  disabled={isVerifying || isOnCooldown || !currentPayment || loading || pendingPayments.length === 0}
                  className="w-1/2 py-2 text-sm font-semibold h-9"
                >
                  {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {!isVerifying && !isOnCooldown && <Check className="mr-2 h-4 w-4" />}
                  {isVerifying ? "Procesando..." : isOnCooldown ? "Espera..." : "Aprobar"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
