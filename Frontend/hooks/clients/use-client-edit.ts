"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useClients } from "@/hooks/clients/use-client"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"

export function useClientEdit() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  useRequireAuth()

  const { loadClientDetail, selectedClient, loading, updateClientProfile } = useClients()

  const [phone, setPhone] = useState("")
  const [emergencyPhone, setEmergencyPhone] = useState("")
  const [address, setAddress] = useState("")

  const clientId = Number(params.id)

  useEffect(() => {
    if (clientId) {
      loadClientDetail(clientId)
    }
  }, [clientId, loadClientDetail])

  useEffect(() => {
    if (selectedClient) {
      setPhone(selectedClient.phone ?? "")
      setEmergencyPhone(selectedClient.emergencyPhone ?? "")
      setAddress(selectedClient.address ?? "")
    }
  }, [selectedClient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await updateClientProfile({
        userId: clientId,
        phone: phone.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
        address: address.trim() || undefined,
      })
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente fueron actualizados exitosamente.",
      })
      router.push("/clients")
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date | string | null | undefined) => {
    try {
      if (!date) {
        return "N/A"
      }

      let parsedDate: Date

      if (typeof date === "string") {
        const dateOnlyMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/)

        if (dateOnlyMatch) {
          const [, year, month, day] = dateOnlyMatch.map(Number)
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

  return {
    user,
    router,
    isLoading,
    loading,
    selectedClient,
    phone,
    setPhone,
    emergencyPhone,
    setEmergencyPhone,
    address,
    setAddress,
    handleSubmit,
    formatDate,
  }
}
