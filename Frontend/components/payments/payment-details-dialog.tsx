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
import { usePaymentDetailsDialog } from "@/hooks/payments/use-payment-details-dialog"
import { MethodType, PaymentStatus } from "@/lib/types"
import { Calendar, Clock, DollarSign, FileImage, User } from "lucide-react"

interface PaymentDetailsDialogProps {
  open: boolean
  onOpenChange: (_open: boolean) => void
  paymentId: number
}

export function PaymentDetailsDialog({ open, onOpenChange, paymentId }: PaymentDetailsDialogProps) {
  const {
    selectedPayment,
    formatDateTime,
    getStatusColor,
    getStatusText,
  } = usePaymentDetailsDialog(paymentId, open)

  if (!selectedPayment) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="size-5 text-primary" />
            Detalles del Pago
          </DialogTitle>
          <DialogDescription>
            Información completa del pago y comprobante asociado
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Payment Info */}
          <div className="rounded-xl border p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="font-medium">{selectedPayment.clientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <span>{formatDateTime(selectedPayment.createdAt as Date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="size-4 text-muted-foreground" />
                <span className="text-lg font-bold">${selectedPayment.amount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <Badge variant={getStatusColor(selectedPayment.status)}>{getStatusText(selectedPayment.status)}</Badge>
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
                  <div key={user.userId} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <User className="size-4 text-muted-foreground" />
                    <div className="flex-1">
                      <span className="font-medium">{user.userName}</span>
                      <span className="ml-2 text-muted-foreground">({user.userDni})</span>
                    </div>
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs">Creador</Badge>
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
                <span className="h-5 w-1 rounded-full bg-primary" />
                {selectedPayment.method === MethodType.CASH ? "Detalles del Pago en Efectivo" : "Notas del Pago"}
              </h4>
              <div className={`rounded-lg p-3 text-sm ${
                selectedPayment.method === MethodType.CASH
                  ? "border border-amber-200 bg-amber-50 text-amber-800"
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
              <div className="rounded-xl border border-dashed py-10 text-center">
                <FileImage className="mx-auto mb-2 size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No hay comprobante subido</p>
              </div>
            )
          )}

          {/* Rejection Reason */}
          {selectedPayment.status === PaymentStatus.REJECTED && selectedPayment.rejectionReason && (
            <div className="rounded-xl border border-destructive/50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-destructive">Razón del Rechazo</h4>
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{selectedPayment.rejectionReason}</p>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-transparent"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
