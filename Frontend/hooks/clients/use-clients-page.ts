"use client"

import { esShortDateYearFormatter } from "@/lib/formatters"
import { fetchPendingUserVerifications, resetClientPasswordToDni } from "@/api/clients/usersApi"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-provider"
import { usePaymentContext } from "@/contexts/payment-provider"
import { useClients } from "@/hooks/clients/use-client"
import { useSettings } from "@/hooks/settings/use-settings"
import { useToast } from "@/hooks/use-toast"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { PaymentStatus, UserRole, UserType } from "@/types"

export function useClientsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  useRequireAuth()

  const { clients, loading, error, loadClients, deleteClient } = useClients()
  const {
    payments,
    createInactiveClientsPayment,
    isCreatingInactivePayments,
  } = usePaymentContext()
  const { monthlyFee } = useSettings()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INACTIVE" | "all">("ACTIVE")

  // ── Carga rápida de pagos para inactivos (solo ADMIN) ───────────────
  const [paymentSelectionMode, setPaymentSelectionMode] = useState(false)
  const [selectedPaymentClientIds, setSelectedPaymentClientIds] = useState<number[]>([])
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false)

  const [clientDetailsDialog, setClientDetailsDialog] = useState<{
    open: boolean
    userId: number | null
  }>({ open: false, userId: null })

  const [exportListOpen, setExportListOpen] = useState(false)

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    clientId: number | null
    clientName: string
  }>({ open: false, clientId: null, clientName: "" })

  const [isDeleting, setIsDeleting] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [pendingVerificationCount, setPendingVerificationCount] = useState(0)

  const [resetPasswordDialog, setResetPasswordDialog] = useState<{
    open: boolean
    clientId: number | null
    clientName: string
    clientDni: number | null
  }>({ open: false, clientId: null, clientName: "", clientDni: null })

  useEffect(() => {
    const loadData = async () => {
      await loadClients()
      const pendingUsers = await fetchPendingUserVerifications()
      setPendingVerificationCount(Array.isArray(pendingUsers) ? pendingUsers.length : 0)
    }

    loadData()
  }, [loadClients])

  // Al abandonar la solapa Inactivos se sale del modo selección y se limpia
  // la selección para que no queden clientes elegidos de una vista anterior.
  useEffect(() => {
    if (statusFilter !== "INACTIVE") {
      setPaymentSelectionMode(false)
      setSelectedPaymentClientIds([])
      setPaymentConfirmOpen(false)
    }
  }, [statusFilter])

  // ── Helpers ─────────────────────────────────────────────────────────

  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  const tokenizeText = (text: string) => normalizeText(text).split(" ").filter(Boolean)

  const searchTokens = tokenizeText(searchTerm)

  const filteredClients = clients
    ? clients.filter((c) => {
        const searchableIndex = normalizeText(
          [
            c.firstName,
            c.lastName,
            `${c.firstName} ${c.lastName}`,
            `${c.lastName} ${c.firstName}`,
            c.email,
            c.phone ?? "",
            c.dni?.toString() ?? "",
          ].join(" "),
        )

        const matchesSearch =
          searchTokens.length === 0 || searchTokens.every((term) => searchableIndex.includes(term))

        if (statusFilter === "all") {
          return matchesSearch
        }

        const isClient = c.role === UserRole.CLIENT

        return (
          isClient &&
          c.status === statusFilter &&
          matchesSearch
        )
      }).sort((a, b) => {
        if (statusFilter !== "all") {
          return 0
        }

        const aIsTrainer = a.role === UserRole.TRAINER
        const bIsTrainer = b.role === UserRole.TRAINER

        if (aIsTrainer === bIsTrainer) {
          return 0
        }

        return aIsTrainer ? -1 : 1
      })
    : []

  // ── Elegibilidad para la carga rápida de pagos ──────────────────────
  // Un cliente es elegible si está inactivo y no tiene un pago pendiente del
  // mes actual. El backend vuelve a validar estas reglas al confirmar, por lo
  // que este chequeo es solo la primera barrera (la vista puede estar
  // desactualizada).

  const hasPendingPaymentThisMonth = (clientId: number): boolean => {
    const now = new Date()

    return payments.some((p) => {
      if (p.status !== PaymentStatus.PENDING) {
        return false
      }

      const involvesClient =
        p.clientId === clientId || (p.associatedUsers?.some((u) => u.userId === clientId) ?? false)

      if (!involvesClient) {
        return false
      }

      const createdAt = p.createdAt ? new Date(p.createdAt) : null

      return (
        !!createdAt &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()
      )
    })
  }

  const getPaymentIneligibilityReason = (client: UserType): string | null => {
    if (client.role !== UserRole.CLIENT || client.status !== "INACTIVE") {
      return "Solo se pueden seleccionar clientes inactivos."
    }
    if (client.dni == null) {
      return "El cliente no tiene DNI cargado."
    }
    if (hasPendingPaymentThisMonth(client.id)) {
      return "Ya tiene un pago pendiente este mes."
    }
    return null
  }

  const isClientEligibleForPayment = (client: UserType): boolean =>
    getPaymentIneligibilityReason(client) === null

  const eligiblePaymentClientsCount = filteredClients.filter(isClientEligibleForPayment).length

  // Derivado de `clients` (no de `filteredClients`) para que la selección
  // sobreviva a cambios en la búsqueda; el diálogo muestra la lista completa.
  const selectedPaymentClientIdSet = new Set(selectedPaymentClientIds)
  const selectedPaymentClients = (clients ?? []).filter(
    (c) => selectedPaymentClientIdSet.has(c.id) && isClientEligibleForPayment(c),
  )

  const formatDate = (date: Date | string | null) => {
    if (!date) {
      return "N/A"
    }

    let parsedDate: Date

    if (typeof date === "string") {
      const dateOnlyMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)

      if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch
        parsedDate = new Date(Number(year), Number(month) - 1, Number(day))
      } else {
        parsedDate = new Date(date)
      }
    } else {
      parsedDate = date
    }

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A"
    }

    return esShortDateYearFormatter.format(parsedDate)
  }

  // ── Handlers ────────────────────────────────────────────────────────

  const handleClientDetails = (userId: number) => setClientDetailsDialog({ open: true, userId })

  const handleOpenDeleteDialog = (clientId: number, clientName: string) => {
    setDeleteDialog({ open: true, clientId, clientName })
  }

  const handleConfirmDelete = async () => {
    if (!deleteDialog.clientId) {
      return
    }
    setIsDeleting(true)
    try {
      await deleteClient(deleteDialog.clientId)
      toast({
        title: "Cliente eliminado",
        description: `${deleteDialog.clientName} fue eliminado exitosamente.`,
      })
      setDeleteDialog({ open: false, clientId: null, clientName: "" })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Handlers de carga rápida de pagos ───────────────────────────────

  const startPaymentSelection = () => {
    setSelectedPaymentClientIds([])
    setPaymentSelectionMode(true)
  }

  const cancelPaymentSelection = () => {
    setPaymentSelectionMode(false)
    setSelectedPaymentClientIds([])
    setPaymentConfirmOpen(false)
  }

  const togglePaymentClientSelection = (clientId: number) => {
    setSelectedPaymentClientIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId],
    )
  }

  const handleOpenPaymentConfirm = () => {
    if (selectedPaymentClients.length > 0) {
      setPaymentConfirmOpen(true)
    }
  }

  const handleConfirmCreatePayments = async () => {
    // monthlyFee <= 0 significa que la cuota todavía no se cargó o falló: el
    // admin no debe poder autorizar un pago sin ver el monto real.
    if (isCreatingInactivePayments || selectedPaymentClients.length === 0 || monthlyFee <= 0) {
      return
    }

    const clientCount = selectedPaymentClients.length

    try {
      await createInactiveClientsPayment({
        clientDnis: selectedPaymentClients.map((c) => c.dni),
        // El backend rechaza la operación si la cuota vigente ya no coincide
        // con la que el admin vio en el diálogo.
        expectedMonthlyFee: monthlyFee,
      })
      toast({
        title: "Pago generado",
        description: `Se generó un pago confirmado para ${clientCount} ${clientCount === 1 ? "cliente" : "clientes"}.`,
      })
      setPaymentConfirmOpen(false)
      setPaymentSelectionMode(false)
      setSelectedPaymentClientIds([])
    } catch {
      // La capa de API ya mostró el detalle del error del backend en un toast.
      // Se cierra el diálogo porque la elegibilidad pudo haber cambiado.
      setPaymentConfirmOpen(false)
    } finally {
      // En éxito los clientes pasan a ACTIVE; en error el estado local puede
      // estar desactualizado. En ambos casos se refresca la lista.
      await loadClients()
    }
  }

  const handleOpenResetPasswordDialog = (clientId: number, clientName: string, clientDni: number | null) => {
    setResetPasswordDialog({ open: true, clientId, clientName, clientDni })
  }

  const handleConfirmResetPassword = async () => {
    if (!resetPasswordDialog.clientId) {
      return
    }

    setIsResettingPassword(true)
    try {
      await resetClientPasswordToDni(resetPasswordDialog.clientId)
      toast({
        title: "Contraseña reiniciada",
        description: `${resetPasswordDialog.clientName} ahora debe ingresar con su DNI (${resetPasswordDialog.clientDni ?? "sin DNI"}).`,
      })
      setResetPasswordDialog({ open: false, clientId: null, clientName: "", clientDni: null })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo reiniciar la contraseña del cliente.",
        variant: "destructive",
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  return {
    user,
    router,
    // Data
    clients,
    loading,
    error,
    filteredClients,
    pendingVerificationCount,
    // State
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    clientDetailsDialog,
    setClientDetailsDialog,
    exportListOpen,
    setExportListOpen,
    deleteDialog,
    setDeleteDialog,
    isDeleting,
    resetPasswordDialog,
    setResetPasswordDialog,
    isResettingPassword,
    // Carga rápida de pagos para inactivos
    paymentSelectionMode,
    selectedPaymentClients,
    selectedPaymentClientIds,
    eligiblePaymentClientsCount,
    paymentConfirmOpen,
    setPaymentConfirmOpen,
    isCreatingInactivePayments,
    monthlyFee,
    isClientEligibleForPayment,
    getPaymentIneligibilityReason,
    startPaymentSelection,
    cancelPaymentSelection,
    togglePaymentClientSelection,
    handleOpenPaymentConfirm,
    handleConfirmCreatePayments,
    // Formatters
    formatDate,
    // Handlers
    handleClientDetails,
    handleOpenDeleteDialog,
    handleConfirmDelete,
    handleOpenResetPasswordDialog,
    handleConfirmResetPassword,
  }
}
