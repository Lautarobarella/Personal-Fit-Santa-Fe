"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { usePaymentContext } from "@/contexts/payment-provider"
import { useMonthlyRevenue } from "@/hooks/settings/use-monthly-revenue"
import { UserRole } from "@/types"

export function useMonthlyRevenuePage() {
  const { user } = useRequireAuth()
  const router = useRouter()
  const [showAmounts, setShowAmounts] = useState(true)

  // Solo permitir acceso a administradores
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      router.push("/dashboard")
    }
  }, [user, router])

  const { archivedRevenues, isLoading: isLoadingArchived } = useMonthlyRevenue(
    user?.role === UserRole.ADMIN
  )

  const { payments, currentMonthRevenue, isLoading: isLoadingPayments } = usePaymentContext()

  const isLoading = isLoadingArchived || isLoadingPayments
  const currentMonthAmount = currentMonthRevenue.amount

  const displayRevenues = archivedRevenues.length > 0 ? archivedRevenues : []

  const totalRevenue = displayRevenues.reduce((sum, rev) => sum + rev.totalRevenue, 0) + currentMonthAmount

  const currentMonthName = new Date().toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  })

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-AR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return ""
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date))
  }

  const handleBack = () => {
    router.push("/settings")
  }

  return {
    user,
    showAmounts,
    setShowAmounts,
    isLoading,
    currentMonthAmount,
    currentMonthName,
    displayRevenues,
    totalRevenue,
    formatCurrency,
    formatDate,
    handleBack,
  }
}
