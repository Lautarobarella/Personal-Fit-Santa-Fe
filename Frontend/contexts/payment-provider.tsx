"use client"

import { usePayment, type PaymentState } from "@/hooks/payments/use-payment"
import { useAuth } from "@/contexts/auth-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createContext, useContext, useState, type ReactNode } from "react"

/**
 * Context type - usa exactamente el mismo tipo que retorna el hook
 */
type PaymentContextType = PaymentState

/**
 * Creación del contexto
 */
const PaymentContext = createContext<PaymentContextType | undefined>(undefined)

/**
 * Props del provider
 */
interface PaymentProviderProps {
  children: ReactNode
}

/**
 * Payment Provider - Wrapper que incluye QueryClient y el context de pagos
 * 
 * Este provider es responsable de:
 * - Proveer QueryClient para React Query
 * - Usar el custom hook usePayment para obtener toda la lógica
 * - Proveer el estado a través del contexto
 * - Mantener la separación de responsabilidades
 * - Determinar automáticamente si el usuario es admin
 */
export function PaymentProvider({ children }: PaymentProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Evitar refetch en window focus durante SSR
        refetchOnWindowFocus: false,
        // Retry solo una vez
        retry: 1,
        // Tiempo de stale data más largo
        staleTime: 5 * 60 * 1000, // 5 minutos
      },
      mutations: {
        // Retry solo una vez para mutaciones
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <PaymentContextProvider>{children}</PaymentContextProvider>
    </QueryClientProvider>
  )
}

/**
 * Provider interno que maneja el contexto de pagos
 */
function PaymentContextProvider({ children }: PaymentProviderProps) {
  const { user } = useAuth()
  
  // Determinar automáticamente si es admin y obtener userId
  const isAdmin = user?.role === 'ADMIN'
  const userId = user?.id
  
  // Usa el custom hook que maneja toda la lógica
  const paymentState = usePayment(userId, isAdmin)

  return (
    <PaymentContext.Provider value={paymentState}>
      {children}
    </PaymentContext.Provider>
  )
}

/**
 * Hook personalizado para usar el contexto de pagos
 * 
 * @throws Error si se usa fuera del PaymentProvider
 * @returns PaymentState - Todo el estado y funciones de pagos
 */
export function usePaymentContext(): PaymentContextType {
  const context = useContext(PaymentContext)
  
  if (context === undefined) {
    throw new Error('usePaymentContext debe ser usado dentro de un PaymentProvider')
  }
  
  return context
}
