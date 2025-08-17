import {
  createPayment,
  fetchAllPayments,
  fetchPaymentDetails,
  fetchUserPayments,
  updatePaymentStatus
} from "@/api/payments/paymentsApi"
import { NewPaymentInput, PaymentType } from "@/lib/types"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useCallback } from "react"

/**
 * Hook unificado para manejo de pagos
 */
export function usePayment(userId?: number, isAdmin?: boolean) {
  const queryClient = useQueryClient()

  const { data: payments = [], isLoading, error } = useQuery<PaymentType[]>({
    queryKey: isAdmin ? ["payments", "admin"] : ["payments", userId],
    queryFn: () =>
      isAdmin ? fetchAllPayments() : fetchUserPayments(userId ?? 0),
    enabled: isAdmin || !!userId, // evita cargar si no hay usuario y no es admin
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  })

  const fetchSinglePayment = useCallback(
    async (paymentId: number): Promise<PaymentType & { receiptUrl: string | null }> => {
      return await fetchPaymentDetails(paymentId)
    },
    [] // sin dependencias, así se memoriza una sola vez
  )

  const createPaymentMutation = useMutation({
    mutationFn: (data: { paymentData: Omit<NewPaymentInput, 'paymentStatus'>, isMercadoPagoPayment: boolean }) =>
      createPayment(data.paymentData, data.isMercadoPagoPayment),
    onSuccess: async (response, variables) => {
      // Invalidar todas las queries de pagos para asegurar que se actualice tanto para admin como para clientes
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ["payments"] })
        
        // Si es un pago automático (admin) o un pago PAID, invalidar ingresos mensuales
        const isAutomaticPayment = variables.isMercadoPagoPayment
        if (isAutomaticPayment) {
          // Invalidar inmediatamente
          queryClient.invalidateQueries({ queryKey: ["monthlyRevenue"] })
          queryClient.invalidateQueries({ queryKey: ["monthlyRevenue", "current"] })
          
          // Invalidar nuevamente después de un breve delay para asegurar consistencia
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["monthlyRevenue"] })
            queryClient.invalidateQueries({ queryKey: ["monthlyRevenue", "current"] })
          }, 1000)
        }
      }
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
    }) => updatePaymentStatus(id, status, rejectionReason),
    onSuccess: (response, variables) => {
      // Invalidar todas las queries de pagos para asegurar que se actualice tanto para admin como para clientes
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ["payments"] })
        
        // Si se aprueba un pago (status = "paid"), invalidar ingresos mensuales
        if (variables.status === "paid") {
          // Invalidar inmediatamente
          queryClient.invalidateQueries({ queryKey: ["monthlyRevenue"] })
          queryClient.invalidateQueries({ queryKey: ["monthlyRevenue", "current"] })
          
          // Invalidar nuevamente después de un breve delay para asegurar consistencia
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["monthlyRevenue"] })
            queryClient.invalidateQueries({ queryKey: ["monthlyRevenue", "current"] })
          }, 1000)
        }
      }
    },
  })

  return {
    // Funcionalidad principal
    payments,
    isLoading,
    error,

    // Operaciones
    createPayment: createPaymentMutation.mutateAsync,
    updatePaymentStatus: updatePaymentMutation.mutateAsync,
    fetchSinglePayment,

    // Aliases para compatibilidad
    loading: isLoading,
  }
}