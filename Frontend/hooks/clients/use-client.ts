import { checkUserMembershipStatus, createUser, deleteUser, fetchUserDetail, fetchUsers } from "@/api/clients/usersApi"
import { updateUserProfile } from "@/api/clients/usersApi"
import { fetchUserPayments } from "@/api/payments/paymentsApi"
import { UserRole, type UserDetailInfo, type UserFormType, type UserType } from "@/lib/types"
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
    emergencyPhone: "",
    address: "",
    role: UserRole.CLIENT,
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
      const payments = await fetchUserPayments(id)
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

  const deleteClient = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await deleteUser(id)
      setClients((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError("Error al eliminar el cliente")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateClientProfile = useCallback(async (data: { userId: number; address?: string; phone?: string; emergencyPhone?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await updateUserProfile(data)
      return response
    } catch (err) {
      setError("Error al actualizar el cliente")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Limpiar cliente seleccionado
  const clearSelectedClient = () => setSelectedClient(null)

  // Verificar si un usuario tiene membresía activa
  const checkMembershipStatus = useCallback(async (userId: number): Promise<boolean> => {
    try {
      return await checkUserMembershipStatus(userId)
    } catch (error) {
      console.error("Error checking membership status:", error)
      return false
    }
  }, [])

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
    checkMembershipStatus,
    deleteClient,
    updateClientProfile,
    setClients, // opcional, por si quieres manipular manualmente
  }
}