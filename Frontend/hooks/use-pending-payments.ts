import { buildReceiptUrl } from "@/api/payments/paymentsApi"
import { usePayment } from "@/hooks/use-payment"
import { PaymentStatus, PaymentType } from "@/lib/types"
import { useEffect, useState } from "react"

export type PendingPaymentType = PaymentType & { receiptUrl: string | null }

export function usePendingPayments(userId?: number, isAdmin?: boolean) {
  const { payments, isLoading } = usePayment(userId, isAdmin)
  const [pendingPayments, setPendingPayments] = useState<PaymentType[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPendingPayments, setTotalPendingPayments] = useState(0)

  // Efecto reactivo que se actualiza cada vez que payments cambia
  useEffect(() => {
    if (!isLoading) {
      const pendings: PaymentType[] = payments
        .filter((p) => p.status === PaymentStatus.PENDING)
        .map((p) => ({
          ...p,
          receiptUrl: buildReceiptUrl(p.receiptId),
        }))
      
      setPendingPayments(pendings)
      setTotalPendingPayments(pendings.length)
      setLoading(false)
    } else {
      // Si está cargando, mantener el estado de loading
      setLoading(true)
    }
  }, [isLoading, payments]) // Dependencias: isLoading y payments (sin initialized)
  
  return {
    pendingPayments,
    loading,
    totalPendingPayments,
  }
}
