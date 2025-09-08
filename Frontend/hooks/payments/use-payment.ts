"use client"

import {
  buildReceiptUrl,
  createPayment,
  fetchAllPayments,
  fetchPaymentDetails,
  fetchUserPayments,
  updatePaymentStatus
} from "@/api/payments/paymentsApi"
import { useAuth } from "@/contexts/auth-provider"
import { MethodType, NewPaymentInput, PaymentStatus, PaymentType } from "@/lib/types"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useCallback, useMemo } from "react"

/**
 * Tipos para el estado del hook
 */
interface PaymentLoadingStates {
  isCreating: boolean
  isUpdating: boolean
  isFetching: boolean
}

interface PaymentMutationResult {
  success: boolean
  message: string
}

export type PendingPaymentType = PaymentType & { receiptUrl: string | null }

interface PaymentStats {
  totalAmount: number
  totalCount: number
  paidAmount: number
  paidCount: number
  pendingAmount: number
  pendingCount: number
  rejectedAmount: number
  rejectedCount: number
}

interface MonthlyRevenue {
  amount: number
  count: number
}

/**
 * Custom Hook para manejar todo el estado y lógica de pagos
 * Centraliza toda la lógica de negocio y estado en un solo lugar
 */
export function usePayment(userId?: number, isAdmin?: boolean) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Determinar automáticamente permisos si no se especifican
  const finalIsAdmin = isAdmin ?? (user?.role === 'ADMIN')
  const finalUserId = userId ?? user?.id

  // Verificación de permisos
  const canManagePayments = finalIsAdmin
  const canViewAllPayments = finalIsAdmin

  // ===============================
  // QUERIES (Consultas de datos)
  // ===============================

  // Query para todos los pagos
  const {
    data: payments = [],
    isLoading: isLoadingPayments,
    error: paymentsError,
    refetch: refetchPayments,
  } = useQuery<PaymentType[]>({
    queryKey: finalIsAdmin ? ["payments", "admin"] : ["payments", finalUserId],
    queryFn: () =>
      finalIsAdmin ? fetchAllPayments() : fetchUserPayments(finalUserId ?? 0),
    enabled: !!(user && (finalIsAdmin || finalUserId)), // Solo ejecutar si hay usuario autenticado
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  })

  // ===============================
  // MUTATIONS (Modificaciones de datos)
  // ===============================

  const createPaymentMutation = useMutation({
    mutationFn: (data: { paymentData: Omit<NewPaymentInput, 'paymentStatus'>, isMercadoPagoPayment: boolean }) =>
      createPayment(data.paymentData, data.isMercadoPagoPayment),
    onSuccess: async (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      
      const isAutomaticPayment = variables.isMercadoPagoPayment
      if (isAutomaticPayment) {
        queryClient.invalidateQueries({ queryKey: ["monthlyRevenue"] })
        queryClient.invalidateQueries({ queryKey: ["monthlyRevenue", "current"] })
        
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["monthlyRevenue"] })
          queryClient.invalidateQueries({ queryKey: ["monthlyRevenue", "current"] })
        }, 1000)
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
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      
      if (variables.status === "paid") {
        queryClient.invalidateQueries({ queryKey: ["monthlyRevenue"] })
        queryClient.invalidateQueries({ queryKey: ["monthlyRevenue", "current"] })
        
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["monthlyRevenue"] })
          queryClient.invalidateQueries({ queryKey: ["monthlyRevenue", "current"] })
        }, 1000)
      }
    },
  })

  // ===============================
  // FUNCIONES DE UTILIDAD
  // ===============================

  // Función para calcular ingresos del mes actual
  const getCurrentMonthRevenue = useCallback((): MonthlyRevenue => {
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

  // Función para obtener pagos pendientes con URL de recibo
  const getPendingPayments = useCallback((): PendingPaymentType[] => {
    if (!payments || payments.length === 0) {
      return []
    }

    return payments
      .filter((p) => p.status === PaymentStatus.PENDING)
      .map((p): PendingPaymentType => ({
        ...p,
        receiptUrl: buildReceiptUrl(p.receiptId),
      }))
  }, [payments])

  // Función para filtrar pagos por estado
  const getPaymentsByStatus = useCallback((status: PaymentStatus): PaymentType[] => {
    if (!payments || payments.length === 0) {
      return []
    }
    return payments.filter(p => p.status === status)
  }, [payments])

  // Función para filtrar pagos por método
  const getPaymentsByMethod = useCallback((method: MethodType): PaymentType[] => {
    if (!payments || payments.length === 0) {
      return []
    }
    return payments.filter(p => p.method === method)
  }, [payments])

  // Función para obtener estadísticas de pagos
  const getPaymentStats = useCallback((): PaymentStats => {
    if (!payments || payments.length === 0) {
      return {
        totalAmount: 0,
        totalCount: 0,
        paidAmount: 0,
        paidCount: 0,
        pendingAmount: 0,
        pendingCount: 0,
        rejectedAmount: 0,
        rejectedCount: 0,
      }
    }

    const paidPayments = payments.filter(p => p.status === PaymentStatus.PAID)
    const pendingPayments = payments.filter(p => p.status === PaymentStatus.PENDING)
    const rejectedPayments = payments.filter(p => p.status === PaymentStatus.REJECTED)

    return {
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      totalCount: payments.length,
      paidAmount: paidPayments.reduce((sum, p) => sum + p.amount, 0),
      paidCount: paidPayments.length,
      pendingAmount: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
      pendingCount: pendingPayments.length,
      rejectedAmount: rejectedPayments.reduce((sum, p) => sum + p.amount, 0),
      rejectedCount: rejectedPayments.length,
    }
  }, [payments])

  // Función para verificar si un usuario tiene pagos pendientes
  const hasUserPendingPayments = useCallback((checkUserId: number): boolean => {
    if (!payments || payments.length === 0) {
      return false
    }
    return payments.some(p => p.clientId === checkUserId && p.status === PaymentStatus.PENDING)
  }, [payments])

  // Función para obtener el último pago de un usuario
  const getUserLastPayment = useCallback((checkUserId: number): PaymentType | null => {
    if (!payments || payments.length === 0) {
      return null
    }
    
    const userPayments = payments.filter(p => p.clientId === checkUserId)
    if (userPayments.length === 0) {
      return null
    }
    
    return userPayments.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )[0]
  }, [payments])

  // Función para verificar si un pago está vencido (para pagos pendientes)
  const isPaymentOverdue = useCallback((payment: PaymentType, daysLimit: number = 7): boolean => {
    if (payment.status !== PaymentStatus.PENDING) {
      return false
    }
    
    const createdDate = payment.createdAt ? new Date(payment.createdAt) : null
    if (!createdDate) {
      return false
    }
    
    const now = new Date()
    const diffInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    return diffInDays > daysLimit
  }, [])

  // ===============================
  // FUNCIONES DE MANIPULACIÓN DE DATOS
  // ===============================

  // Función para obtener detalles de un pago específico
  const fetchSinglePayment = useCallback(
    async (paymentId: number): Promise<PaymentType & { receiptUrl: string | null }> => {
      return await fetchPaymentDetails(paymentId)
    },
    []
  )

  // Función para refrescar pagos
  const refreshPayments = useCallback(async (): Promise<void> => {
    await refetchPayments()
  }, [refetchPayments])

  // ===============================
  // FUNCIONES WRAPPER PARA MUTACIONES
  // ===============================

  const createNewPayment = useCallback(async (
    paymentData: Omit<NewPaymentInput, 'paymentStatus'>, 
    isMercadoPagoPayment: boolean = false
  ): Promise<PaymentMutationResult> => {
    try {
      await createPaymentMutation.mutateAsync({ paymentData, isMercadoPagoPayment })
      return { success: true, message: "Pago creado exitosamente" }
    } catch (error) {
      return { success: false, message: "Error al crear el pago" }
    }
  }, [createPaymentMutation])

  const updatePaymentStatusAction = useCallback(async (
    id: number,
    status: "paid" | "rejected",
    rejectionReason?: string
  ): Promise<PaymentMutationResult> => {
    if (!canManagePayments) {
      throw new Error("No tienes permisos para actualizar pagos")
    }
    
    try {
      await updatePaymentMutation.mutateAsync({ id, status, rejectionReason })
      const statusText = status === "paid" ? "aprobado" : "rechazado"
      return { success: true, message: `Pago ${statusText} exitosamente` }
    } catch (error) {
      return { success: false, message: "Error al actualizar el estado del pago" }
    }
  }, [updatePaymentMutation, canManagePayments])

  // ===============================
  // ESTADOS COMPUTADOS
  // ===============================

  // Memorizar resultados para evitar recálculos innecesarios
  const currentMonthRevenue = useMemo(() => getCurrentMonthRevenue(), [getCurrentMonthRevenue])
  const pendingPayments = useMemo(() => getPendingPayments(), [getPendingPayments])
  const paymentStats = useMemo(() => getPaymentStats(), [getPaymentStats])
  const totalPendingPayments = useMemo(() => pendingPayments.length, [pendingPayments])

  // Función para obtener snapshot del total actual de pagos pendientes
  // Útil para páginas que necesitan mantener el total fijo durante el proceso
  const getInitialPendingCount = useCallback((): number => {
    return pendingPayments.length
  }, [pendingPayments])

  // Estado de carga consolidado
  const isLoading = useMemo(() => isLoadingPayments, [isLoadingPayments])

  // Error consolidado
  const error = useMemo(() => paymentsError?.message || null, [paymentsError])

  // Estados de carga específicos para mutaciones
  const loadingStates: PaymentLoadingStates = useMemo(() => ({
    isCreating: createPaymentMutation.isPending,
    isUpdating: updatePaymentMutation.isPending,
    isFetching: isLoadingPayments,
  }), [
    createPaymentMutation.isPending,
    updatePaymentMutation.isPending,
    isLoadingPayments,
  ])

  // ===============================
  // RETORNO DEL HOOK
  // ===============================

  return {
    // Data
    payments,
    pendingPayments,
    currentMonthRevenue,
    paymentStats,
    totalPendingPayments,
    
    // Loading states
    isLoading,
    error,
    loading: isLoading, // Alias para compatibilidad
    ...loadingStates,
    
    // Mutations
    createPayment: createPaymentMutation.mutateAsync, // Mantener compatibilidad
    createNewPayment,
    updatePaymentStatus: updatePaymentMutation.mutateAsync, // Mantener compatibilidad
    updatePaymentStatusAction,
    
    // Data fetching
    fetchSinglePayment,
    refreshPayments,
    
    // Utility functions
    getPaymentsByStatus,
    getPaymentsByMethod,
    hasUserPendingPayments,
    getUserLastPayment,
    isPaymentOverdue,
    getCurrentMonthRevenue,
    getPendingPayments,
    getPaymentStats,
    getInitialPendingCount,

    // Permission checks
    canManagePayments,
    canViewAllPayments,
    isAdmin: finalIsAdmin,
  }
}

export type PaymentState = ReturnType<typeof usePayment>