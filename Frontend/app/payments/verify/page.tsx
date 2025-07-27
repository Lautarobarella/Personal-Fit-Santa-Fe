"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Calendar, User, DollarSign, Loader2, Check, X, Clock, ArrowLeft, CheckCircle } from "lucide-react"
import { usePayment } from "@/hooks/use-payment"

export default function PaymentVerificationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const { pendingPayments, loadPendingPaymentDetail, updatePaymentStatus } = usePayment()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [completedCount, setCompletedCount] = useState(0)

  const currentPayment = pendingPayments[currentIndex]

  useEffect(() => {
    // If no pendingPayments to verify, redirect backç
    loadPendingPaymentDetail()
    if (pendingPayments.length === 0) {
      router.push("/pendingPayments")
    }
  }, [pendingPayments.length, router])

  if (!user || user.role !== "admin") {
    router.push("/pendingPayments")
    return null
  }

  if (!currentPayment) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Verificación Completada" showBack onBack={() => router.push("/pendingPayments")} />
        <div className="container py-12 text-center">
          <CheckCircle className="h-16 w-16 mx-auto text-success mb-4" />
          <h2 className="text-2xl font-bold mb-2">¡Verificación Completada!</h2>
          <p className="text-muted-foreground mb-6">Has verificado {completedCount} pagos exitosamente.</p>
          <Button onClick={() => router.push("/pendingPayments")}>Volver a Pagos</Button>
        </div>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date))
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

  const handleVerify = async (status: "paid" | "rejected") => {
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
      
      updatePaymentStatus(currentPayment.id, status, status === "rejected" ? rejectionReason : undefined)

      toast({
        title: status === "paid" ? "Pago aprobado" : "Pago rechazado",
        description: `El pago de ${currentPayment.clientName} ha sido ${status === "paid" ? "aprobado" : "rechazado"}`,
      })

      setCompletedCount((prev) => prev + 1)
      setRejectionReason("")

      // Move to next payment or finish
      if (currentIndex < pendingPayments.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else {
        // All pendingPayments verified, show completion screen
        setTimeout(() => {
          setCurrentIndex(-1) // This will trigger the completion screen
        }, 1000)
      }
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

  const remainingCount = pendingPayments.length - currentIndex
  const progress = (currentIndex / pendingPayments.length) * 100

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader
        title="Verificar Pagos"
        showBack
        onBack={() => router.push("/pendingPayments")}
        actions={
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} de {pendingPayments.length}
          </div>
        }
      />

      <div className="container py-6 space-y-6">
        {/* Progress Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso de Verificación</span>
              <span className="text-sm text-muted-foreground">
                {completedCount} completados, {remainingCount} restantes
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{currentPayment.clientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(currentPayment.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-bold text-lg">${currentPayment.amount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Badge variant="warning">Pendiente</Badge>
              </div>
            </div>

            {currentPayment.createdAt && (
              <div className="pt-3 border-t">
                <span className="text-sm text-muted-foreground">
                  Comprobante subido: {formatDateTime(currentPayment.createdAt)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receipt Display */}
        <Card>
          <CardContent className="p-6">
            <Label className="text-sm font-medium mb-3 block">Comprobante de Pago</Label>
            <div className="border rounded-lg overflow-hidden mb-4">
              <img
                src={currentPayment.receiptUrl || "/placeholder.svg"}
                alt="Comprobante de pago"
                className="w-full max-h-96 object-contain bg-gray-50"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(currentPayment.receiptUrl, "_blank")}
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

        {/* Rejection Reason */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
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
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 sticky bottom-6">
          <Button
            variant="destructive"
            onClick={() => handleVerify("rejected")}
            disabled={isVerifying}
            className="flex-1"
          >
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <X className="mr-2 h-4 w-4" />
            Rechazar
          </Button>
          <Button onClick={() => handleVerify("paid")} disabled={isVerifying} className="flex-1">
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Check className="mr-2 h-4 w-4" />
            Aprobar
          </Button>
        </div>

        {/* Next Payment Preview */}
        {currentIndex < pendingPayments.length - 1 && (
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span>
                  Siguiente: {pendingPayments[currentIndex + 1]?.clientName} -{" "}
                  {formatDate(pendingPayments[currentIndex + 1]?.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
