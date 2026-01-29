"use client"

import { usePayment, type PaymentState } from "@/hooks/payments/use-payment"
import { useAuth } from "@/contexts/auth-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createContext, useContext, useState, type ReactNode } from "react"

/**
 * Payment Context Interface
 * Inherits the exact state shape from the `usePayment` hook.
 * This ensures strict type safety between the logic and the consumers.
 */
type PaymentContextType = PaymentState

/**
 * Context Initialization
 * Default is undefined to enforce usage within the Provider.
 */
const PaymentContext = createContext<PaymentContextType | undefined>(undefined)

interface PaymentProviderProps {
  children: ReactNode
}

/**
 * Payment Provider Component
 * 
 * Architectural Role:
 * 1. State Management: Wraps the application part requiring payment logic.
 * 2. Dependency Injection: Injects `QueryClient` for efficient data fetching.
 * 3. Logic Centralization: Instantiates `usePayment` once and distributes it via Context.
 * 
 * Features:
 * - Optimized React Query configuration (staleTime: 5 mins, retry: 1)
 * - Automatic Admin role detection from Auth Context.
 */
export function PaymentProvider({ children }: PaymentProviderProps) {
  // Initialize QueryClient lazily to ensure it persists across re-renders
  // but is reset on full page reloads.
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Optimization: Prevent refetching when user switches tabs (common in dashboard usage)
        refetchOnWindowFocus: false,
        // Error handling: Minimal retries to fail fast on network issues
        retry: 1,
        // Cache data for 5 minutes since payment history rarely changes instantaneously
        staleTime: 5 * 60 * 1000,
      },
      mutations: {
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
 * Internal Context Provider (Separated for cleaner QueryClient scope)
 * 
 * Connects the `useAuth` user state with the `usePayment` logic.
 */
function PaymentContextProvider({ children }: PaymentProviderProps) {
  const { user } = useAuth()

  // Dynamic Role Resolution:
  // Payments logic often behaves differently for Admins (View All) vs Clients (View Own).
  // We compute this once here to simplify the hook logic.
  const isAdmin = user?.role === 'ADMIN'
  const userId = user?.id

  // Core Logic Hook:
  // This is where the actual business logic for payments resides.
  const paymentState = usePayment(userId, isAdmin)

  return (
    <PaymentContext.Provider value={paymentState}>
      {children}
    </PaymentContext.Provider>
  )
}

/**
 * usePaymentContext Hook
 * 
 * The public API for consuming payment data.
 * 
 * @throws Error if used outside of <PaymentProvider />
 * @returns The full payment state (payments list, loading status, revenue stats, etc.)
 */
export function usePaymentContext(): PaymentContextType {
  const context = useContext(PaymentContext)

  if (context === undefined) {
    throw new Error('usePaymentContext debe ser usado dentro de un PaymentProvider')
  }

  return context
}
