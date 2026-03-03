"use client"

import { usePaymentContext } from "@/contexts/payment-provider"
import { PaymentStatus, PaymentType } from "@/lib/types"
import { useEffect, useState } from "react"

export function usePaymentDetailsDialog(paymentId: number, open: boolean) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentType | null>(null)
  const { fetchSinglePayment } = usePaymentContext()

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
    selectedPayment,
    formatDateTime,
    getStatusColor,
    getStatusText,
  }
}
