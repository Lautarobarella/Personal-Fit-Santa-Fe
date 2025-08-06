import { useState, useCallback } from "react"
import { fetchUsers, fetchUserDetail, createUser } from "@/api/clients/usersApi"
import type { UserDetailInfo, UserFormType, UserType } from "@/lib/types"
import { fetchPaymentsById } from "@/api/payment/paymentsApi"

export function useClients() {
  const [clients, setClients] = useState<UserType[]>([])
  const [selectedClient, setSelectedClient] = useState<UserDetailInfo | null>(null)
    const [form, setForm] = useState<UserFormType>({
    dni: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    role: "client",
    joinDate: "",
    birthDate: "",
    password: "",
    })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar todos los clientes
  const loadClients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchUsers()
      setClients(data)
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
      const payments = await fetchPaymentsById(id)
      detail.listPayments = payments // Asignar pagos al detalle del cliente
      setSelectedClient(detail)
    } catch (err) {
      setError("Error al cargar el detalle del cliente")
    } finally {
      setLoading(false)
    }
  }, [])

  const createClient = useCallback(async (clientData: UserFormType) => {
    setLoading(true)
    setError(null)
    try {
      createUser(clientData)
    } catch (err) {
      setError("Error al crear el cliente")
    }
    setLoading(false)
  }, [])

  // Limpiar cliente seleccionado
  const clearSelectedClient = () => setSelectedClient(null)

  return {
    clients,
    selectedClient,
    form,
    loading,
    error,
    setForm,
    createClient,
    loadClients,
    loadClientDetail,
    clearSelectedClient,
    setClients, // opcional, por si quieres manipular manualmente
  }
}