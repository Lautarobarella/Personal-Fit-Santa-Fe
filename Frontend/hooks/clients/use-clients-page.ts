"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-provider"
import { useClients } from "@/hooks/clients/use-client"
import { useToast } from "@/hooks/use-toast"
import { useRequireAuth } from "@/hooks/use-require-auth"

export function useClientsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  useRequireAuth()

  const { clients, loading, error, loadClients, deleteClient } = useClients()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INACTIVE" | "all">("ACTIVE")

  const [clientDetailsDialog, setClientDetailsDialog] = useState<{
    open: boolean
    userId: number | null
  }>({ open: false, userId: null })

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    clientId: number | null
    clientName: string
  }>({ open: false, clientId: null, clientName: "" })

  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadClients()
  }, [loadClients])

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

        return (
          (statusFilter === "all" ? true : c.status === statusFilter) &&
          matchesSearch
        )
      })
    : []

  const formatDate = (date: Date | string | null) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date ?? "N/A"))
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

  return {
    user,
    router,
    // Data
    clients,
    loading,
    error,
    filteredClients,
    // State
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    clientDetailsDialog,
    setClientDetailsDialog,
    deleteDialog,
    setDeleteDialog,
    isDeleting,
    // Formatters
    formatDate,
    // Handlers
    handleClientDetails,
    handleOpenDeleteDialog,
    handleConfirmDelete,
  }
}
