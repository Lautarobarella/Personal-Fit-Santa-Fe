// components/providers/payment-provider.tsx
"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode, useState } from "react"

export function PaymentProvider({ children }: { children: ReactNode }) {
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
            {children}
        </QueryClientProvider>
    )
}
