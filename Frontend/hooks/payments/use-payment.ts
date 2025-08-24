import {
    createPayment,
    fetchAllPayments,
    fetchPaymentDetails,
    fetchUserPayments,
    updatePaymentStatus
} from "@/api/payments/paymentsApi"
import { NewPaymentInput, PaymentStatus, PaymentType } from "@/lib/types"
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query"
import { useCallback, useMemo } from "react"

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

  // Función para calcular ingresos del mes actual desde los payments existentes
  const getCurrentMonthRevenue = useCallback(() => {
    if (!payments || payments.length === 0) {
      return { amount: 0, count: 0 }
    }

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const currentMonthPayments = payments.filter(p => {
      const paymentDate = p.createdAt ? new Date(p.createdAt) : null
      return p.status === PaymentStatus.PAID &&
             paymentDate &&
             paymentDate.getMonth() === currentMonth &&
             paymentDate.getFullYear() === currentYear
    })

    return {
      amount: currentMonthPayments.reduce((sum, p) => sum + p.amount, 0),
      count: currentMonthPayments.length
    }
  }, [payments])

  // Memorizar el resultado para evitar recalculos innecesarios
  const currentMonthRevenue = useMemo(() => getCurrentMonthRevenue(), [getCurrentMonthRevenue])

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

    // Ingresos del mes actual calculados desde los payments existentes
    currentMonthRevenue,

    // Operaciones
    createPayment: createPaymentMutation.mutateAsync,
    updatePaymentStatus: updatePaymentMutation.mutateAsync,
    fetchSinglePayment,

    // Aliases para compatibilidad
    loading: isLoading,
  }
}