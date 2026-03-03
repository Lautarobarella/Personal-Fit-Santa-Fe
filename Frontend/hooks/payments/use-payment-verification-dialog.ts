"use client"

import { usePaymentContext } from "@/contexts/payment-provider"
import { useToast } from "@/hooks/use-toast"
import { PaymentStatus, PaymentType } from "@/lib/types"
import { useEffect, useState } from "react"

export function usePaymentVerificationDialog(
  paymentId: number,
  open: boolean,
  onOpenChange: (open: boolean) => void,
) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<PaymentType | null>(null)

  const { toast } = useToast()
  const { fetchSinglePayment, updatePaymentStatus } = usePaymentContext()

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

  return {
    isVerifying,
    rejectionReason,
    setRejectionReason,
    selectedPayment,
    formatDateTime,
    handleStatusUpdate,
    getStatusColor,
    getStatusText,
  }
}
