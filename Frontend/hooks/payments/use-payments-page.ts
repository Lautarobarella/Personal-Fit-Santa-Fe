"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchPaymentsByMonthAndYear } from "@/api/payments/paymentsApi"
import { usePaymentContext } from "@/contexts/payment-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getPaymentCreationWindowLabel, isWithinPaymentCreationWindow } from "@/lib/payment-rules"
import { MethodType, PaymentStatus, UserRole } from "@/types"

const getAdminShowRevenueStorageKey = (userId?: number) =>
  `payments.admin.showRevenue.${userId ?? "default"}`

export function usePaymentsPage() {
  const { user } = useRequireAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Basic state
  const [searchTerm, setSearchTerm] = useState("")
  const [showRevenue, setShowRevenue] = useState(true)
  const [showRevenuePreferenceReady, setShowRevenuePreferenceReady] = useState(false)

  const revenueStorageKey = getAdminShowRevenueStorageKey(user?.id)

  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      setShowRevenue(true)
      setShowRevenuePreferenceReady(true)
      return
    }

    try {
      const storedValue = localStorage.getItem(revenueStorageKey)
      if (storedValue !== null) {
        setShowRevenue(storedValue === "true")
      }
    } catch {
      // Ignore storage errors (private mode, blocked storage, etc.)
    } finally {
      setShowRevenuePreferenceReady(true)
    }
  }, [user?.role, revenueStorageKey])

  useEffect(() => {
    if (!showRevenuePreferenceReady || user?.role !== UserRole.ADMIN) {
      return
    }

    try {
      localStorage.setItem(revenueStorageKey, String(showRevenue))
    } catch {
      // Ignore storage errors (private mode, blocked storage, etc.)
    }
  }, [showRevenuePreferenceReady, showRevenue, user?.role, revenueStorageKey])

  // Admin state
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)

  const { payments, isLoading } = usePaymentContext()

  // Dialog state
  const [verificationDialog, setVerificationDialog] = useState({
    open: false,
    paymentId: null as number | null,
  })
  const [detailsDialog, setDetailsDialog] = useState({
    open: false,
    paymentId: null as number | null,
  })

  // Refresh on mount
  useEffect(() => {
    if (!user?.id && user?.role !== UserRole.ADMIN) {
      return
    }
    const queryKey = user?.role === UserRole.ADMIN ? ["payments", "admin"] : ["payments", user.id]
    queryClient.invalidateQueries({ queryKey })
    if (user?.role === UserRole.ADMIN) {
      queryClient.invalidateQueries({ queryKey: ["monthlyRevenue"] })
    }
  }, [user?.id, user?.role, queryClient])

  const {
    data: adminPayments = [],
    isLoading: isLoadingAdminPayments,
  } = useQuery({
    queryKey: ["payments", "admin", selectedYear, selectedMonth],
    queryFn: () => fetchPaymentsByMonthAndYear(selectedYear, selectedMonth),
    enabled: user?.role === UserRole.ADMIN,
  })

  // Validate dates
  useEffect(() => {
    const now = new Date()
    const curYear = now.getFullYear()
    const curMonth = now.getMonth() + 1
    if (selectedYear > curYear) {
      setSelectedYear(curYear)
      setSelectedMonth(curMonth)
      return
    }
    if (selectedYear === curYear && selectedMonth > curMonth) {
      setSelectedMonth(curMonth)
    }
  }, [selectedYear, selectedMonth])

  // ── Formatters ──────────────────────────────────────────────────────

  const formatDate = (date: Date | string | null) => {
    if (!date) {
      return ""
    }
    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case PaymentStatus.PAID: return "success"
      case PaymentStatus.PENDING: return "warning"
      case PaymentStatus.REJECTED:
      case PaymentStatus.EXPIRED: return "destructive"
      default: return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case PaymentStatus.PAID: return "Pagado"
      case PaymentStatus.PENDING: return "Pendiente"
      case PaymentStatus.REJECTED: return "Rechazado"
      case PaymentStatus.EXPIRED: return "Vencido"
      default: return status
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-AR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getMethodText = (method: MethodType) => {
    switch (method) {
      case MethodType.CASH: return "Efectivo"
      case MethodType.TRANSFER: return "Transferencia"
      default: return method
    }
  }

  // ── Computed values ─────────────────────────────────────────────────

  const sourcePayments = user?.role === UserRole.ADMIN ? adminPayments : payments

  const filteredPayments = sourcePayments.filter((p: any) => {
    if (user?.role !== UserRole.ADMIN) {
      return true
    }
    return (
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(p.createdAt).toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const sortedAllPayments = [...filteredPayments].sort(
    (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )

  const paidPayments = filteredPayments.filter((p: any) => p.status === PaymentStatus.PAID)

  const pendingPayments = filteredPayments
    .filter((p: any) => p.status === PaymentStatus.PENDING)
    .sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return user?.role === UserRole.CLIENT ? dateB - dateA : dateA - dateB
    })

  const totalRevenue =
    user?.role === UserRole.ADMIN
      ? adminPayments
          .filter((p: any) => p.status === PaymentStatus.EXPIRED || p.status === PaymentStatus.PAID)
          .reduce((sum: number, p: any) => sum + p.amount, 0)
      : paidPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

  const activePayment = paidPayments.find((p: any) => {
    const now = new Date()
    const expiresAt = p.expiresAt ? new Date(p.expiresAt) : null
    return p.status === PaymentStatus.PAID && expiresAt && expiresAt > now
  })

  const pendingPayment = pendingPayments.find((p: any) => p.status === PaymentStatus.PENDING)

  const isPaymentCreationWindowOpen = isWithinPaymentCreationWindow()
  const paymentCreationWindowLabel = getPaymentCreationWindowLabel()
  const canCreateNewPayment =
    user?.role === UserRole.ADMIN
      ? isPaymentCreationWindowOpen
      : user?.role === UserRole.CLIENT
        ? isPaymentCreationWindowOpen && !pendingPayment
        : false

  // ── Handlers ────────────────────────────────────────────────────────

  const handleVerificationClick = (id: number) => setVerificationDialog({ open: true, paymentId: id })
  const handleDetailsClick = (id: number) => setDetailsDialog({ open: true, paymentId: id })

  const handleMonthChange = (value: string) => setSelectedMonth(parseInt(value))

  const handleYearChange = (value: string) => {
    const newYear = parseInt(value)
    setSelectedYear(newYear)
    const now = new Date()
    if (newYear === now.getFullYear() && selectedMonth > now.getMonth() + 1) {
      setSelectedMonth(now.getMonth() + 1)
    }
  }

  const getCurrentDateInfo = () => ({
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
  })

  return {
    user,
    router,
    // State
    searchTerm,
    setSearchTerm,
    showRevenue,
    setShowRevenue,
    selectedYear,
    selectedMonth,
    isLoadingAdminPayments,
    isLoading,
    verificationDialog,
    setVerificationDialog,
    detailsDialog,
    setDetailsDialog,
    // Computed
    sortedAllPayments,
    paidPayments,
    pendingPayments,
    totalRevenue,
    activePayment,
    pendingPayment,
    canCreateNewPayment,
    isPaymentCreationWindowOpen,
    paymentCreationWindowLabel,
    // Formatters
    formatDate,
    getStatusColor,
    getStatusText,
    formatCurrency,
    getMethodText,
    // Handlers
    handleVerificationClick,
    handleDetailsClick,
    handleMonthChange,
    handleYearChange,
    getCurrentDateInfo,
  }
}
