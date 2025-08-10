import { buildReceiptUrl } from "@/api/payment/paymentsApi"
import { usePayment } from "@/hooks/use-payment"
import { PaymentStatus, PaymentType } from "@/lib/types"
import { useEffect, useState } from "react"

export type PendingPaymentType = PaymentType & { receiptUrl: string | null }

export function usePendingPayments(userId?: number, isAdmin?: boolean) {
  const { payments, isLoading, fetchSinglePayment } = usePayment(userId, isAdmin)
  const [pendingPayments, setPendingPayments] = useState<PaymentType[]>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [ totalPendingPayments, setTotalPendingPayments ] = useState(0)

  // Carga inicial robusta, incluso si payments llega vacío
  useEffect(() => {
    // loading termina solo cuando termina la carga inicial de payments (sea vacía o no)
    if (!isLoading && !initialized) {
      const pendings: PaymentType[] = payments
        .filter((p) => p.status === PaymentStatus.PENDING)
        .map((p) => ({
          ...p,
          receiptUrl: buildReceiptUrl(p.receiptId),
        }))
      setPendingPayments(pendings)
      setTotalPendingPayments(pendings.length)
      setLoading(false)
      setInitialized(true)
    }
  }, [isLoading, payments, initialized])
  
  return {
    pendingPayments,
    loading,
    totalPendingPayments,
  }
}
