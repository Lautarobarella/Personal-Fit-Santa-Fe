"use client"

import { esNumericDateTimeFormatter } from "@/lib/formatters"
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
    return esNumericDateTimeFormatter.format(new Date(date))
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
