"use client"

import { PaymentReceiptDisplay } from "@/components/payments/payment-receipt-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePaymentVerificationDialog } from "@/hooks/payments/use-payment-verification-dialog"
import { MethodType, PaymentStatus } from "@/lib/types"
import { Calendar, Check, Clock, DollarSign, FileImage, Loader2, User, X } from "lucide-react"

interface PaymentVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentId: number
}

export function PaymentVerificationDialog({ open, onOpenChange, paymentId }: PaymentVerificationDialogProps) {
  const {
    isVerifying,
    rejectionReason,
    setRejectionReason,
    selectedPayment,
    formatDateTime,
    handleStatusUpdate,
    getStatusColor,
    getStatusText,
  } = usePaymentVerificationDialog(paymentId, open, onOpenChange)

  if (!selectedPayment) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="pr-12">
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="size-5 shrink-0 text-primary" />
            <span className="min-w-0">Verificar Comprobante de Pago</span>
          </DialogTitle>
          <DialogDescription>Revisa el comprobante subido por el cliente y aprueba o rechaza el pago</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          {/* Payment Info — 2x2 compacto también en mobile */}
          <div className="rounded-xl border p-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <User className="size-4 shrink-0 text-primary/70" />
                <span className="truncate font-medium">{selectedPayment.clientName}</span>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <Calendar className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{formatDateTime(selectedPayment.createdAt as Date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="size-4 shrink-0 text-primary/70" />
                <span className="font-bold">${selectedPayment.amount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <Badge variant={getStatusColor(selectedPayment.status)} className="px-2 text-xs">
                  {getStatusText(selectedPayment.status)}
                </Badge>
              </div>
            </div>

            {selectedPayment.receiptUrl && (
              <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
                Comprobante subido: {formatDateTime(selectedPayment.createdAt as Date)}
              </p>
            )}
          </div>

          {/* Associated Users - Solo mostrar si hay múltiples usuarios */}
          {selectedPayment.associatedUsers && selectedPayment.associatedUsers.length > 1 && (
            <div className="rounded-xl border">
              <h4 className="flex items-center gap-2 px-4 pb-2 pt-4 text-sm font-semibold">
                <span className="h-5 w-1 rounded-full bg-primary" />
                Clientes Relacionados ({selectedPayment.associatedUsers.length})
              </h4>
              <div className="divide-y border-t">
                {selectedPayment.associatedUsers.map((user: any, index: number) => (
                  <div key={user.userId} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <User className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1 truncate">
                      <span className="font-medium">{user.userName}</span>
                      <span className="ml-2 text-muted-foreground">({user.userDni})</span>
                    </div>
                    {index === 0 && (
                      <Badge variant="outline" className="shrink-0 text-xs">Creador</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas del pago - Mostrar siempre si existen, más prominente para efectivo */}
          {selectedPayment.notes && (
            <div className="rounded-xl border p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
                {selectedPayment.method === MethodType.CASH ? "Detalles del Pago en Efectivo" : "Notas del Pago"}
              </h4>
              <div className={`rounded-lg p-3 text-sm ${
                selectedPayment.method === MethodType.CASH
                  ? "border border-yellow-500/30 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400"
                  : "bg-muted/50"
              }`}>
                {selectedPayment.notes}
              </div>
            </div>
          )}

          {/* Receipt Display - Solo para métodos que NO sean efectivo */}
          {selectedPayment.method !== MethodType.CASH && (
            selectedPayment.receiptId ? (
              <div className="rounded-xl border p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <span className="h-5 w-1 rounded-full bg-primary" />
                  Comprobante de Pago
                </h4>
                <PaymentReceiptDisplay
                  fileId={selectedPayment.receiptId}
                  fileName={`comprobante-${selectedPayment.clientName}-${selectedPayment.id}`}
                  className=""
                  showActions={true}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed py-6 text-center">
                <FileImage className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No hay comprobante subido</p>
              </div>
            )
          )}

          {/* Rejection Reason */}
          {selectedPayment.status === PaymentStatus.REJECTED && selectedPayment.rejectionReason && (
            <div className="rounded-xl border border-destructive/50 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
                <span className="h-5 w-1 rounded-full bg-destructive" />
                Razón del Rechazo
              </h4>
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{selectedPayment.rejectionReason}</p>
            </div>
          )}

          {/* Rejection Reason Input (for new rejections) */}
          {selectedPayment.status === PaymentStatus.PENDING && (
            <div className="rounded-xl border p-4">
              <Label htmlFor="rejectionReason" className="text-sm font-medium">
                Razón del rechazo (opcional para aprobación, requerida para rechazo)
              </Label>
              <Textarea
                id="rejectionReason"
                placeholder="Explica por qué se rechaza el pago..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="mt-2 resize-none text-sm"
              />
            </div>
          )}
        </DialogBody>

        {/* Una sola fila: Cancelar compacto + Rechazar/Aprobar elásticos.
            En mobile se ocultan los íconos estáticos para que los tres
            botones entren sin desbordar el dialog. */}
        <DialogFooter className="flex-row items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isVerifying}
            className={selectedPayment.status === PaymentStatus.PENDING ? "shrink-0 px-3" : "flex-1"}
          >
            Cancelar
          </Button>

          {selectedPayment.status === PaymentStatus.PENDING && (
            <>
              <Button
                variant="secondary"
                onClick={() => handleStatusUpdate("rejected")}
                disabled={isVerifying}
                className="min-w-0 flex-1 px-2"
              >
                {isVerifying ? (
                  <Loader2 className="mr-1.5 size-4 shrink-0 animate-spin" />
                ) : (
                  <X className="mr-1.5 size-4 shrink-0 max-sm:hidden" />
                )}
                Rechazar
              </Button>
              <Button
                onClick={() => handleStatusUpdate("paid")}
                disabled={isVerifying}
                className="min-w-0 flex-1 px-2"
              >
                {isVerifying ? (
                  <Loader2 className="mr-1.5 size-4 shrink-0 animate-spin" />
                ) : (
                  <Check className="mr-1.5 size-4 shrink-0 max-sm:hidden" />
                )}
                Aprobar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
