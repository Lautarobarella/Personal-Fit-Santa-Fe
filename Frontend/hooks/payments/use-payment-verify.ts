"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { usePaymentContext } from "@/contexts/payment-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useToast } from "@/hooks/use-toast"
import { MethodType, PaymentStatus, UserRole } from "@/types"
import type { PaymentType } from "@/types"

export function usePaymentVerify() {
  const { user } = useRequireAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [isVerifying, setIsVerifying] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [show, setShow] = useState(true)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [isOnCooldown, setIsOnCooldown] = useState(false)

  // Queue logic
  const [paymentQueue, setPaymentQueue] = useState<number[]>([])
  const [currentPaymentId, setCurrentPaymentId] = useState<number | null>(null)
  const initialPendingCount = useRef<number | null>(null)
  const hasInitialized = useRef(false)

  const VERIFICATION_COOLDOWN = 2000

  const {
    pendingPayments,
    isLoading: loading,
    updatePaymentStatus,
    fetchSinglePayment,
  } = usePaymentContext()

  // Initialize queue (once)
  useEffect(() => {
    if (!loading && !hasInitialized.current && pendingPayments.length > 0) {
      const initialQueue = pendingPayments.map((p) => p.id)
      setPaymentQueue(initialQueue)
      setCurrentPaymentId(initialQueue[0] || null)
      initialPendingCount.current = initialQueue.length
      hasInitialized.current = true
    } else if (!loading && !hasInitialized.current && pendingPayments.length === 0) {
      initialPendingCount.current = 0
      hasInitialized.current = true
    }
  }, [loading, pendingPayments])

  const [currentPayment, setCurrentPayment] = useState<PaymentType | null>(null)

  // Load current payment
  useEffect(() => {
    if (currentPaymentId) {
      const fetchPayment = async () => {
        try {
          const payment = await fetchSinglePayment(currentPaymentId)
          setCurrentPayment(payment)
        } catch {
          moveToNextPayment()
        }
      }
      fetchPayment()
    } else {
      setCurrentPayment(null)
    }
  }, [currentPaymentId, fetchSinglePayment])

  const moveToNextPayment = () => {
    setPaymentQueue((prevQueue) => {
      const newQueue = prevQueue.slice(1)
      setCurrentPaymentId(newQueue[0] || null)
      return newQueue
    })
  }

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      router.replace("/payments")
    }
  }, [user, router])

  const isVerificationComplete =
    !loading && paymentQueue.length === 0 && initialPendingCount.current !== null

  // ── Formatters ──────────────────────────────────────────────────────

  const formatDateTime = (date: Date | string | null) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date ?? "N/A"))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case PaymentStatus.PAID: return "success"
      case PaymentStatus.REJECTED: return "destructive"
      case PaymentStatus.PENDING: return "warning"
      default: return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case PaymentStatus.PAID: return "Pagado"
      case PaymentStatus.REJECTED: return "Rechazado"
      case PaymentStatus.PENDING: return "Pendiente"
      default: return status
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────

  const handleStatusUpdate = async (status: "paid" | "rejected") => {
    if (!currentPayment) return

    if (status === "rejected" && !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar una razón para rechazar el pago",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    setIsOnCooldown(true)

    try {
      await updatePaymentStatus({
        id: currentPayment.id,
        status,
        rejectionReason: status === "rejected" ? rejectionReason : undefined,
      })

      toast({
        title: status === "paid" ? "Pago aprobado" : "Pago rechazado",
        description: `El pago de ${currentPayment.clientName} ha sido ${status === "paid" ? "aprobado" : "rechazado"}`,
      })

      setRejectionReason("")
      setShow(false)

      setTimeout(() => {
        setShow(true)
        moveToNextPayment()
        setReviewedCount((prev) => prev + 1)
      }, 350)

      setTimeout(() => setIsOnCooldown(false), VERIFICATION_COOLDOWN)
    } catch {
      setIsOnCooldown(false)
      toast({
        title: "Error",
        description: "No se pudo procesar la verificación",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return {
    user,
    router,
    // State
    isVerifying,
    rejectionReason,
    setRejectionReason,
    show,
    reviewedCount,
    isOnCooldown,
    paymentQueue,
    currentPayment,
    initialPendingCount,
    loading,
    pendingPayments,
    isVerificationComplete,
    // Formatters
    formatDateTime,
    getStatusColor,
    getStatusText,
    // Handlers
    handleStatusUpdate,
  }
}
