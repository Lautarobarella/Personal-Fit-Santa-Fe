import {
  createPayment,
  fetchPaymentDetail,
  fetchPayments,
  fetchPaymentsById,
  updatePayment,
} from "@/api/payment/paymentsApi"
import { PaymentType, VerifyPaymentType, NewPaymentInput } from "@/lib/types"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

export function usePayment(userId?: number, isAdmin?: boolean) {
  const queryClient = useQueryClient()

  const { data: payments = [], isLoading, error } = useQuery<PaymentType[]>({
    queryKey: ["payments", userId],
    queryFn: () =>
      isAdmin ? fetchPayments() : fetchPaymentsById(userId ?? 0),
    enabled: !!userId, // evita cargar si no hay usuario
  })

  const { data: selectedPayment, refetch: refetchPaymentDetail } =
    useQuery<VerifyPaymentType>({
      queryKey: ["payment-detail", userId],
      queryFn: () => fetchPaymentDetail(userId ?? 0),
      enabled: false,
    })

  const createPaymentMutation = useMutation({
    mutationFn: (data: NewPaymentInput) => createPayment(data),
    onSuccess: () => {
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
      queryClient.invalidateQueries({ queryKey: ["payments"] })
    },
  })

  return {
    payments,
    isLoading,
    error,
    selectedPayment,
    refetchPaymentDetail,
    createNewPayment: createPaymentMutation.mutateAsync,
    updatePaymentStatus: updatePaymentMutation.mutateAsync,
  }
}