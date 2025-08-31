"use client"

import { useAuth } from "@/contexts/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * Hook personalizado que maneja la autenticación requerida
 * Redirige automáticamente al login si no hay usuario autenticado
 */
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Solo redirigir cuando termine de cargar y no haya usuario
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  return { user, loading }
}
