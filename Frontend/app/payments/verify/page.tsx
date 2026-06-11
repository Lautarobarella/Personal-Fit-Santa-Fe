"use client"

import { PaymentReceiptDisplay } from "@/components/payments/payment-receipt-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <Check className="size-16 text-success mb-4" />
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
        <Loader2 className="size-8 animate-spin mb-2" />
        <p className="text-muted-foreground">Cargando pagos pendientes…</p>
      </div>
    )
  }

  const verifyActionsDisabled =
    isVerifying || isOnCooldown || !currentPayment || loading || pendingPayments.length === 0

  // Render principal — compacto: sin scroll salvo pantallas muy chicas
  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <MobileHeader
        title="Verificar Pagos"
        showBack
        onBack={() => router.replace("/payments")}
      />

      <div className="container-centered space-y-2 py-3 pb-6">
        {/* Progreso */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
            <span className="font-medium">Progreso</span>
            <span className="text-right text-muted-foreground">
              {reviewedCount} completados, {paymentQueue.length} pendientes
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{
                width: initialPendingCount.current
                  ? `${(reviewedCount / initialPendingCount.current) * 100}%`
                  : "0%",
              }}
            />
          </div>
        </div>

        <div className={`transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}>
          {/* Renderiza solo si hay currentPayment */}
          {currentPayment && (
            <div className="grid gap-2 lg:grid-cols-2 lg:items-start">
              {/* Columna: datos del pago */}
              <div className="space-y-2">
                {/* Detalle del pago */}
                <div className="rounded-xl border p-3">
                  <div className="grid grid-cols-2 gap-2.5 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <User className="size-4 shrink-0 text-primary/70" />
                      <span className="truncate font-medium">{currentPayment.clientName}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <Calendar className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{formatDateTime(currentPayment.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="size-4 shrink-0 text-primary/70" />
                      <span className="font-bold">{currentPayment.amount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 shrink-0 text-muted-foreground" />
                      <Badge variant={getStatusColor(currentPayment.status)} className="px-2 text-xs">
                        {getStatusText(currentPayment.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Clientes relacionados - Solo mostrar si hay múltiples usuarios */}
                {currentPayment.associatedUsers && currentPayment.associatedUsers.length > 1 && (
                  <div className="rounded-xl border p-3">
                    <p className="mb-1.5 text-sm font-medium">
                      Clientes Relacionados ({currentPayment.associatedUsers.length})
                    </p>
                    <div className="divide-y">
                      {currentPayment.associatedUsers.map((assocUser: any, index: number) => (
                        <div key={assocUser.userId} className="flex items-center gap-2 py-1.5 text-sm">
                          <User className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate font-medium">{assocUser.userName}</span>
                          <span className="shrink-0 text-muted-foreground">({assocUser.userDni})</span>
                          {index === 0 && (
                            <Badge variant="outline" className="ml-auto shrink-0 text-xs">Creador</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notas del pago - Mostrar siempre si existen, más prominente para efectivo */}
                {currentPayment.notes && (
                  <div className="rounded-xl border p-3">
                    <p className="mb-1.5 text-sm font-medium">
                      {currentPayment.method === MethodType.CASH ? "Detalles del Pago en Efectivo" : "Notas del Pago"}
                    </p>
                    <div
                      className={`rounded-lg p-2 text-sm ${
                        currentPayment.method === MethodType.CASH
                          ? "border border-yellow-500/30 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400"
                          : "bg-muted/50"
                      }`}
                    >
                      {currentPayment.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Columna: comprobante y decisión */}
              <div className="space-y-2">
                {/* Comprobante - Solo para métodos que NO sean efectivo */}
                {currentPayment.method !== MethodType.CASH && (
                  <div className="rounded-xl border p-3">
                    <p className="mb-1.5 text-sm font-medium">Comprobante de Pago</p>
                    <PaymentReceiptDisplay
                      fileId={currentPayment.receiptId}
                      fileName={`comprobante-${currentPayment.clientName}-${currentPayment.id}`}
                      className=""
                      showActions={true}
                      pdfHeight="280px"
                      imageHeight="280px"
                    />
                  </div>
                )}

                {/* Razón del rechazo */}
                <div className="rounded-xl border p-3">
                  <Label htmlFor="rejectionReason" className="text-sm font-medium">
                    Razón del rechazo
                  </Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Explica por qué se rechaza el pago…"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={2}
                    className="mt-1.5 resize-none text-sm"
                    disabled={!currentPayment}
                  />
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="secondary"
                    onClick={() => handleStatusUpdate("rejected")}
                    disabled={verifyActionsDisabled}
                    className="h-9 flex-1 text-sm font-semibold"
                  >
                    {isVerifying && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {!isVerifying && <X className="mr-2 size-4" />}
                    {isOnCooldown ? "Espera…" : "Rechazar"}
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleStatusUpdate("paid")}
                    disabled={verifyActionsDisabled}
                    className="h-9 flex-1 text-sm font-semibold"
                  >
                    {isVerifying && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {!isVerifying && !isOnCooldown && <Check className="mr-2 size-4" />}
                    {isVerifying ? "Procesando…" : isOnCooldown ? "Espera…" : "Aprobar"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
