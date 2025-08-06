import {
    buildReceiptUrl,
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
    queryKey: isAdmin ? ["payments", "admin"] : ["payments", userId],
    queryFn: () =>
      isAdmin ? fetchPayments() : fetchPaymentsById(userId ?? 0),
    enabled: isAdmin || !!userId, // evita cargar si no hay usuario y no es admin
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

  const createPaymentWithStatusMutation = useMutation({
    mutationFn: (data: { paymentData: Omit<NewPaymentInput, 'paymentStatus'>, isMercadoPagoPayment: boolean }) => 
      createPaymentWithStatus(data.paymentData, data.isMercadoPagoPayment),
    onSuccess: () => {
      // Invalidar todas las queries de pagos para asegurar que se actualice tanto para admin como para clientes
      queryClient.invalidateQueries({ queryKey: ["payments"] })
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
      // Invalidar todas las queries de pagos para asegurar que se actualice tanto para admin como para clientes
      queryClient.invalidateQueries({ queryKey: ["payments"] })
    },
  })

  return {
    payments,
    isLoading,
    error,
    createPaymentWithStatus: createPaymentWithStatusMutation.mutateAsync,
    updatePaymentStatus: updatePaymentMutation.mutateAsync,
    fetchSinglePayment,
  }
}