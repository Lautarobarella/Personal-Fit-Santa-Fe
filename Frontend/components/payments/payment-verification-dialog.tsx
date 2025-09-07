"use client"

import { PaymentReceiptDisplay } from "@/components/payments/payment-receipt-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePaymentContext } from "@/contexts/payment-provider"
import { useToast } from "@/hooks/use-toast"
import { MethodType, PaymentStatus, PaymentType } from "@/lib/types"
import { Calendar, Check, Clock, DollarSign, FileImage, Loader2, User, X } from "lucide-react"
import { useEffect, useState } from "react"

interface PaymentVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentId: number
}

export function PaymentVerificationDialog({ open, onOpenChange, paymentId }: PaymentVerificationDialogProps) {

  const [isVerifying, setIsVerifying] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<PaymentType | null>(null)

  const { toast } = useToast()

  const {
    fetchSinglePayment,
    updatePaymentStatus,
  } = usePaymentContext()

  useEffect(() => {
    if (!open) return

    fetchSinglePayment(paymentId).then(setSelectedPayment)
  }, [open, paymentId, fetchSinglePayment])


  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const handleStatusUpdate = async (status: "paid" | "rejected") => {

    if (selectedPayment?.id === undefined) return null

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
        id: selectedPayment.id,
        status,
        rejectionReason: status === "rejected" ? rejectionReason : undefined,
      })


      toast({
        title: status === "paid" ? "Pago aprobado" : "Pago rechazado",
        description: `El pago de ${selectedPayment?.clientName} ha sido ${status === "paid" ? "aprobado" : "rechazado"}`,
      })


      onOpenChange(false)
      setRejectionReason("")
      // clearSelectedPayment()
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case PaymentStatus.PAID:
        return "success"
      case PaymentStatus.REJECTED:
        return "destructive"
      case PaymentStatus.PENDING:
        return "warning"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case PaymentStatus.PAID:
        return "Pagado"
      case PaymentStatus.REJECTED:
        return "Rechazado"
      case PaymentStatus.PENDING:
        return "Pendiente"
      default:
        return status
    }
  }

  if (!selectedPayment) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col">

        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Verificar Comprobante de Pago
          </DialogTitle>
          <DialogDescription>Revisa el comprobante subido por el cliente y aprueba o rechaza el pago</DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[60vh]">
          {/* Payment Info */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedPayment.clientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateTime(selectedPayment.createdAt as Date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold text-lg">${selectedPayment.amount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={getStatusColor(selectedPayment.status)}>{getStatusText(selectedPayment.status)}</Badge>
                </div>
              </div>

              {selectedPayment.receiptUrl && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    Comprobante subido: {formatDateTime(selectedPayment.createdAt as Date)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Associated Users card - Solo mostrar si hay múltiples usuarios */}
          {selectedPayment.associatedUsers && selectedPayment.associatedUsers.length > 1 && (
            <Card>
              <CardContent className="p-4">
                <Label className="text-sm font-medium mb-3 block">Clientes Relacionados ({selectedPayment.associatedUsers.length})</Label>
                <div className="space-y-2">
                  {selectedPayment.associatedUsers.map((user: any, index: number) => (
                    <div key={user.userId} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="font-medium">{user.userName}</span>
                        <span className="text-muted-foreground ml-2">({user.userDni})</span>
                      </div>
                      {index === 0 && (
                        <Badge variant="outline" className="text-xs">Creador</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notas del pago - Mostrar siempre si existen, más prominente para efectivo */}
          {selectedPayment.notes && (
            <Card>
              <CardContent className="p-4">
                <Label className="text-sm font-medium mb-2 block">
                  {selectedPayment.method === MethodType.CASH ? "Detalles del Pago en Efectivo" : "Notas del Pago"}
                </Label>
                <div className={`p-3 rounded text-sm ${
                  selectedPayment.method === MethodType.CASH 
                    ? "bg-amber-50 border border-amber-200 text-amber-800" 
                    : "bg-muted/50"
                }`}>
                  {selectedPayment.notes}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Receipt Display - Solo para métodos que NO sean efectivo */}
          {selectedPayment.method !== MethodType.CASH && (
            selectedPayment.receiptId ? (
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-medium mb-2 block">Comprobante de Pago</Label>
                  <PaymentReceiptDisplay
                    fileId={selectedPayment.receiptId}
                    fileName={`comprobante-${selectedPayment.clientName}-${selectedPayment.id}`}
                    className=""
                    showActions={true}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No hay comprobante subido</p>
                </CardContent>
              </Card>
            )
          )}

          {/* Rejection Reason */}
          {selectedPayment.status === PaymentStatus.REJECTED && selectedPayment.rejectionReason && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <Label className="text-sm font-medium text-destructive mb-2 block">Razón del Rechazo</Label>
                <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{selectedPayment.rejectionReason}</p>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason Input (for new rejections) */}
          {selectedPayment.status === PaymentStatus.PENDING && (
            <Card>
              <CardContent className="p-4">
                <Label htmlFor="rejectionReason" className="text-sm font-medium">
                  Razón del rechazo (opcional para aprobación, requerida para rechazo)
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Explica por qué se rechaza el pago..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Fixed footer with action buttons */}
        <DialogFooter className="flex-shrink-0 flex gap-3 pt-6 border-t mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isVerifying}
            className="bg-transparent"
          >
            Cancelar
          </Button>

          {selectedPayment.status === PaymentStatus.PENDING && (
            <>
              <Button variant="secondary" onClick={() => handleStatusUpdate("rejected")} disabled={isVerifying}>
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <X className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
              <Button onClick={() => handleStatusUpdate("paid")} disabled={isVerifying}>
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Check className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

  )
}
