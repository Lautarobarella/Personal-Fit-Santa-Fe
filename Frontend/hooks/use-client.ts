import { createUser, fetchUserDetail, fetchUsers, updateUser, deleteUser } from "@/api/clients/usersApi"
import { fetchPaymentsById } from "@/api/payment/paymentsApi"
import type { UserDetailInfo, UserFormType, UserType } from "@/lib/types"
import { useCallback, useState } from "react"

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
      const response = await createUser(clientData)
      return response // Retornar la respuesta para que el componente pueda mostrar el mensaje
    } catch (err) {
      setError("Error al crear el cliente")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateClient = useCallback(async (id: number, clientData: UserFormType) => {
    setLoading(true)
    setError(null)
    try {
      const response = await updateUser(id, clientData)
      // Recargar la lista de clientes después de actualizar
      await loadClients()
      return response
    } catch (err) {
      setError("Error al actualizar el cliente")
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadClients])

  const deleteClient = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await deleteUser(id)
      // Recargar la lista de clientes después de eliminar
      await loadClients()
      return response
    } catch (err) {
      setError("Error al eliminar el cliente")
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadClients])

  return {
    clients,
    selectedClient,
    form,
    setForm,
    loading,
    error,
    loadClients,
    loadClientDetail,
    createClient,
    updateClient,
    deleteClient,
  }
}