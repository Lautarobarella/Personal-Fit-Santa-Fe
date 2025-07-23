import { useState, useCallback } from "react"
import { fetchUsers, fetchUserDetail } from "@/app/api/clients/clientsApi"
import type { UserDetailInfo, UserType } from "@/lib/types"

export function useClients() {
  const [clients, setClients] = useState<UserType[]>([])
  const [selectedClient, setSelectedClient] = useState<UserDetailInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar todos los clientes
  const loadClients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchUsers()
      setClients(data)
      console.log("Clientes cargados:", data)
    } catch (err) {
      setError("Error al cargar los clientes")
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar detalle de un cliente
  const loadClientDetail = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const detail = await fetchUserDetail(id)
      setSelectedClient(detail)
      console.log("Detalle del cliente cargado:", detail)
    } catch (err) {
      setError("Error al cargar el detalle del cliente")
    } finally {
      setLoading(false)
    }
  }, [])

  // Limpiar cliente seleccionado
  const clearSelectedClient = () => setSelectedClient(null)

  return {
    clients,
    selectedClient,
    loading,
    error,
    loadClients,
    loadClientDetail,
    clearSelectedClient,
    setClients, // opcional, por si quieres manipular manualmente
  }
}