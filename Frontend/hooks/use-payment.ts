import {
  buildReceiptUrl,
  createPayment,
  fetchAllPayments,
  fetchPaymentDetails,
  fetchUserPayments,
  updatePaymentStatus,
} from "@/api/payments/paymentsApi"
import { NewPaymentInput, PaymentStatus, PaymentType } from "@/lib/types"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useCallback, useMemo } from "react"

export type PendingPaymentType = PaymentType & { receiptUrl: string | null }

/**
 * Hook unificado para manejo de pagos
 * Incluye funcionalidad de pagos pendientes integrada
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

  // Calcular pagos pendientes de forma optimizada
  const pendingPayments = useMemo(() => {
    return payments
      .filter((p) => p.status === PaymentStatus.PENDING)
      .map((p) => ({
        ...p,
        receiptUrl: buildReceiptUrl(p.receiptId),
      }))
  }, [payments])

  const fetchSinglePayment = useCallback(
    async (paymentId: number): Promise<PaymentType & { receiptUrl: string | null }> => {
      return await fetchPaymentDetails(paymentId)
    },
    [] // sin dependencias, así se memoriza una sola vez
  )

  const createPaymentMutation = useMutation({
    mutationFn: (data: { paymentData: Omit<NewPaymentInput, 'paymentStatus'>, isMercadoPagoPayment: boolean }) => 
      createPayment(data.paymentData, data.isMercadoPagoPayment),
    onSuccess: () => {
      // Invalidar todas las queries de pagos para asegurar que se actualice tanto para admin como para clientes
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ["payments"] })
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
    onSuccess: () => {
      // Invalidar todas las queries de pagos para asegurar que se actualice tanto para admin como para clientes
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ["payments"] })
      }
    },
  })

  return {
    // Funcionalidad principal
    payments,
    isLoading,
    error,
    
    // Funcionalidad de pagos pendientes integrada
    pendingPayments,
    totalPendingPayments: pendingPayments.length,
    
    // Operaciones
    createPaymentWithStatus: createPaymentMutation.mutateAsync,
    updatePaymentStatus: updatePaymentMutation.mutateAsync,
    fetchSinglePayment,
    
    // Aliases para compatibilidad
    loading: isLoading,
  }
}

/**
 * Hook especializado para pagos pendientes
 * Mantiene compatibilidad con código existente
 */
export function usePendingPayments(userId?: number, isAdmin?: boolean) {
  const { pendingPayments, totalPendingPayments, isLoading } = usePayment(userId, isAdmin)
  
  return {
    pendingPayments,
    loading: isLoading,
    totalPendingPayments,
  }
}