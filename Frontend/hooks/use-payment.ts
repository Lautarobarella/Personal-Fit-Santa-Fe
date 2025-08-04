import {
  buildReceiptUrl,
  createPayment,
  createPaymentWithStatus,
  fetchPaymentDetail,
  fetchPayments,
  fetchPaymentsById,
  updatePayment,
} from "@/api/payment/paymentsApi"
import { NewPaymentInput, PaymentType } from "@/lib/types"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useCallback } from "react"

export function usePayment(userId?: number, isAdmin?: boolean) {
  const queryClient = useQueryClient()

  const { data: payments = [], isLoading, error } = useQuery<PaymentType[]>({
    queryKey: ["payments", userId],
    queryFn: () =>
      isAdmin ? fetchPayments() : fetchPaymentsById(userId ?? 0),
    enabled: !!userId, // evita cargar si no hay usuario
  })

  const fetchSinglePayment = useCallback(
    async (paymentId: number): Promise<PaymentType & { receiptUrl: string | null }> => {
      const rawPayment = await fetchPaymentDetail(paymentId)
      return {
        ...rawPayment,
        receiptUrl: buildReceiptUrl(rawPayment.receiptId),
      }
    },
    [] // sin dependencias, así se memoriza una sola vez
  )

  const fetchAllPendingPayments = useCallback(async (): Promise<(PaymentType & { receiptUrl: string | null })[]> => {
    try {
      const response = await fetch("/api/payment/pending")
      const rawPayments: PaymentType[] = await response.json()
      return await Promise.all(rawPayments.map((p) => fetchSinglePayment(p.id)))
    } catch (error) {
      return []
    }
  }, [fetchSinglePayment])


  const createPaymentMutation = useMutation({
    mutationFn: (data: NewPaymentInput) => createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", userId] })
    },
  })

  const createPaymentWithStatusMutation = useMutation({
    mutationFn: (data: { paymentData: Omit<NewPaymentInput, 'paymentStatus'>, isMercadoPagoPayment: boolean }) => 
      createPaymentWithStatus(data.paymentData, data.isMercadoPagoPayment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", userId] })
    },
  })

  const updatePaymentMutation = useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason,
    }: {
      id: number
      status: "paid" | "rejected"
      rejectionReason?: string
    }) => updatePayment(id, status, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", userId] })
    },
  })

  return {
    payments,
    isLoading,
    error,
    createNewPayment: createPaymentMutation.mutateAsync,
    createPaymentWithStatus: createPaymentWithStatusMutation.mutateAsync,
    updatePaymentStatus: updatePaymentMutation.mutateAsync,
    fetchSinglePayment,
    fetchAllPendingPayments,
  }
}