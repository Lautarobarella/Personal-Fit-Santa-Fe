"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Calendar, User, DollarSign, FileImage, Loader2, Check, X, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface PaymentVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: {
    id: string
    clientName: string
    month: string
    amount: number
    status: string
    receiptUrl?: string
    receiptUploadedAt?: Date
    rejectionReason?: string
  }
  onVerify: (paymentId: string, status: "pagado" | "rechazado", reason?: string) => Promise<void>
}

export function PaymentVerificationDialog({ open, onOpenChange, payment, onVerify }: PaymentVerificationDialogProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const { toast } = useToast()

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
    return new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
    }).format(date)
  }

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const handleVerify = async (status: "pagado" | "rechazado") => {
    if (status === "rechazado" && !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar una razón para rechazar el pago",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)

    try {
      await onVerify(payment.id, status, status === "rechazado" ? rejectionReason : undefined)

      toast({
        title: status === "pagado" ? "Pago aprobado" : "Pago rechazado",
        description: `El pago de ${payment.clientName} ha sido ${status === "pagado" ? "aprobado" : "rechazado"}`,
      })

      onOpenChange(false)
      setRejectionReason("")
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
      case "pagado":
        return "success"
      case "rechazado":
        return "destructive"
      case "pendiente":
        return "warning"
      case "vencido":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pagado":
        return "Pagado"
      case "rechazado":
        return "Rechazado"
      case "pendiente":
        return "Pendiente"
      case "vencido":
        return "Vencido"
      default:
        return status
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Verificar Comprobante de Pago
          </DialogTitle>
          <DialogDescription>Revisa el comprobante subido por el cliente y aprueba o rechaza el pago</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Info */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{payment.clientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatMonth(payment.month)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold text-lg">${payment.amount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={getStatusColor(payment.status)}>{getStatusText(payment.status)}</Badge>
                </div>
              </div>

              {payment.receiptUploadedAt && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    Comprobante subido: {formatDateTime(payment.receiptUploadedAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receipt Display */}
          {payment.receiptUrl ? (
            <Card>
              <CardContent className="p-4">
                <Label className="text-sm font-medium mb-2 block">Comprobante de Pago</Label>
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={payment.receiptUrl || "/placeholder.svg"}
                    alt="Comprobante de pago"
                    className="w-full max-h-96 object-contain bg-gray-50"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(payment.receiptUrl, "_blank")}
                    className="bg-transparent"
                  >
                    Ver en tamaño completo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement("a")
                      link.href = payment.receiptUrl!
                      link.download = `comprobante-${payment.clientName}-${payment.month}.jpg`
                      link.click()
                    }}
                    className="bg-transparent"
                  >
                    Descargar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No hay comprobante subido</p>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason */}
          {payment.status === "rechazado" && payment.rejectionReason && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <Label className="text-sm font-medium text-destructive mb-2 block">Razón del Rechazo</Label>
                <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{payment.rejectionReason}</p>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason Input (for new rejections) */}
          {payment.status === "pendiente" && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">
                Razón del rechazo (opcional para aprobación, requerida para rechazo)
              </Label>
              <Textarea
                id="rejectionReason"
                placeholder="Explica por qué se rechaza el pago..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isVerifying}
            className="bg-transparent"
          >
            Cancelar
          </Button>

          {payment.status === "pendiente" && payment.receiptUrl && (
            <>
              <Button variant="destructive" onClick={() => handleVerify("rechazado")} disabled={isVerifying}>
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <X className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
              <Button onClick={() => handleVerify("pagado")} disabled={isVerifying}>
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
