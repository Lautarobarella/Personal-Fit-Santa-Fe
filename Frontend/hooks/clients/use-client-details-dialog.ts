"use client"

import { useAuth } from "@/contexts/auth-provider"
import { usePaymentContext } from "@/contexts/payment-provider"
import { useClients } from "@/hooks/clients/use-client"
import { AttendanceStatus, PaymentStatus } from "@/lib/types"
import { useEffect, useMemo, useState } from "react"

export function useClientDetailsDialog(userId: number, isOpen: boolean) {
  const { user } = useAuth()
  const { payments } = usePaymentContext()
  const [activeTab, setActiveTab] = useState("profile")
  const [visibleSummaryActivityId, setVisibleSummaryActivityId] = useState<number | null>(null)
  const { loading, error, loadClientDetail, selectedClient } = useClients()

  useEffect(() => {
    if (isOpen) {
      loadClientDetail(userId)
    }
  }, [loadClientDetail, userId, isOpen])

  useEffect(() => {
    if (!isOpen) {
      setVisibleSummaryActivityId(null)
    }
  }, [isOpen])

  const toggleSummaryVisibility = (id: number) => {
    setVisibleSummaryActivityId((currentId) => (currentId === id ? null : id))
  }

  const formatDate = (date: Date | string | null | undefined) => {
    try {
      if (!date) {
        return "N/A"
      }

      let parsedDate: Date

      if (typeof date === "string") {
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = date.split("-").map(Number)
          parsedDate = new Date(year, month - 1, day)
        } else {
          parsedDate = new Date(date)
        }
      } else {
        parsedDate = date
      }

      if (isNaN(parsedDate.getTime())) {
        console.warn("Fecha inválida:", date)
        return "N/A"
      }

      return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(parsedDate)
    } catch (err) {
      console.error("Error al formatear fecha:", err, date)
      return "N/A"
    }
  }

  const formatFullDate = (date: Date | string | null | undefined): string => {
    try {
      if (!date) {
        return "N/A"
      }

      const parsedDate = typeof date === "string" ? new Date(date) : date

      if (isNaN(parsedDate.getTime())) {
        console.warn("Fecha inválida:", date)
        return "N/A"
      }

      return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsedDate)
    } catch (err) {
      console.error("Error al formatear fecha:", err, date)
      return "N/A"
    }
  }

  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success"
      case "ACTIVE":
        return "default"
      case "CANCELLED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getActivityStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Completada"
      case "ACTIVE":
        return "Activa"
      case "CANCELLED":
        return "Cancelada"
      default:
        return status
    }
  }

  const getAttendanceColor = (attendance: string | undefined) => {
    switch (attendance) {
      case "PRESENT":
        return "text-green-600"
      case "ABSENT":
        return "text-red-600"
      case "LATE":
        return "text-yellow-600"
      case "PENDING":
        return "text-blue-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getAttendanceText = (attendance: string | undefined) => {
    switch (attendance) {
      case "PRESENT":
        return "Presente"
      case "ABSENT":
        return "Ausente"
      case "LATE":
        return "Tarde"
      case "PENDING":
        return "Pendiente"
      default:
        return "N/A"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "success"
      case "PENDING":
        return "warning"
      case "REJECTED":
        return "destructive"
      case "EXPIRED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "PAID":
        return "Pagado"
      case "PENDING":
        return "Pendiente"
      case "REJECTED":
        return "Rechazado"
      case "EXPIRED":
        return "Vencido"
      default:
        return status
    }
  }

  const getMethodText = (method: string) => {
    switch (method) {
      case "CASH":
        return "Efectivo"
      case "CARD":
        return "Tarjeta"
      case "TRANSFER":
        return "Transferencia"
      default:
        return method
    }
  }

  const syncedClient = useMemo(() => {
    if (!selectedClient) {
      return null
    }

    const livePaymentsById = new Map(
      payments
        .filter((payment) => payment.clientId === selectedClient.id)
        .map((payment) => [payment.id, payment]),
    )

    return {
      ...selectedClient,
      listPayments: selectedClient.listPayments.map((payment) => {
        const livePayment = livePaymentsById.get(payment.id)
        return livePayment ? { ...payment, ...livePayment } : payment
      }),
    }
  }, [payments, selectedClient])

  const presentActivities = useMemo(
    () =>
      syncedClient?.listActivity.filter(
        (activity) =>
          activity.clientStatus === AttendanceStatus.PRESENT || activity.clientStatus === AttendanceStatus.LATE,
      ) ?? [],
    [syncedClient],
  )

  const absentActivities = useMemo(
    () => syncedClient?.listActivity.filter((activity) => activity.clientStatus === AttendanceStatus.ABSENT) ?? [],
    [syncedClient],
  )

  const enrolledActivities = useMemo(
    () => syncedClient?.listActivity.filter((activity) => activity.clientStatus === AttendanceStatus.PENDING) ?? [],
    [syncedClient],
  )

  const attendanceRate =
    presentActivities.length > 0
      ? Math.round((presentActivities.length / (presentActivities.length + absentActivities.length)) * 100)
      : 0

  const lastCompletedActivityDate = useMemo(() => {
    if (!syncedClient?.listActivity.length) {
      return syncedClient?.lastActivity ?? null
    }

    const lastTimestamp = syncedClient.listActivity.reduce<number | null>((latestTimestamp, activity) => {
      const isCompletedAttendance =
        activity.clientStatus === AttendanceStatus.PRESENT || activity.clientStatus === AttendanceStatus.LATE

      if (!isCompletedAttendance || !activity.date) {
        return latestTimestamp
      }

      const parsedTimestamp = new Date(activity.date).getTime()
      if (Number.isNaN(parsedTimestamp)) {
        return latestTimestamp
      }

      if (latestTimestamp === null || parsedTimestamp > latestTimestamp) {
        return parsedTimestamp
      }

      return latestTimestamp
    }, null)

    return lastTimestamp !== null ? new Date(lastTimestamp) : syncedClient.lastActivity ?? null
  }, [syncedClient])

  const completedActivitiesThisMonth = useMemo(() => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    return presentActivities.reduce((count, activity) => {
      if (!activity.date) {
        return count
      }

      const parsedDate = new Date(activity.date)
      if (Number.isNaN(parsedDate.getTime())) {
        return count
      }

      const isCurrentMonth =
        parsedDate.getMonth() === currentMonth && parsedDate.getFullYear() === currentYear

      return isCurrentMonth ? count + 1 : count
    }, 0)
  }, [presentActivities])

  const completedPayments =
    syncedClient?.listPayments.filter((p) => p.status === PaymentStatus.PAID) ?? []
  const pendingPayments =
    syncedClient?.listPayments.filter((p) => p.status === PaymentStatus.PENDING) ?? []
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0)

  return {
    user,
    activeTab,
    setActiveTab,
    visibleSummaryActivityId,
    toggleSummaryVisibility,
    loading,
    error,
    selectedClient: syncedClient,
    formatDate,
    formatFullDate,
    getActivityStatusColor,
    getActivityStatusText,
    getAttendanceColor,
    getAttendanceText,
    getPaymentStatusColor,
    getPaymentStatusText,
    getMethodText,
    presentActivities,
    absentActivities,
    enrolledActivities,
    attendanceRate,
    completedPayments,
    pendingPayments,
    totalPaid,
    totalPending,
    lastCompletedActivityDate,
    completedActivitiesThisMonth,
  }
}
