"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useToast } from "@/hooks/use-toast"
import { updateUserProfile } from "@/api/clients/usersApi"

export function useSettingsEdit() {
  const { refreshUser } = useAuth()
  const { user } = useRequireAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [profileData, setProfileData] = useState({
    address: "",
    phone: "",
    emergencyPhone: "",
  })

  const [isLoading, setIsLoading] = useState(false)

  // Cargar datos actuales del usuario
  useEffect(() => {
    if (user) {
      setProfileData({
        address: user.address || "",
        phone: user.phone || "",
        emergencyPhone: user.emergencyPhone || "",
      })
    }
  }, [user])

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateForm = (): boolean => {
    if (!profileData.phone.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El teléfono es requerido",
      })
      return false
    }

    if (!profileData.address.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La dirección es requerida",
      })
      return false
    }

    const phoneRegex = /^[0-9\s\-\+\(\)]+$/
    if (!phoneRegex.test(profileData.phone)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El formato del teléfono no es válido",
      })
      return false
    }

    if (profileData.emergencyPhone && !phoneRegex.test(profileData.emergencyPhone)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El formato del teléfono de emergencia no es válido",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    if (!user) return

    setIsLoading(true)

    try {
      await updateUserProfile({
        userId: user.id,
        address: profileData.address,
        phone: profileData.phone,
        emergencyPhone: profileData.emergencyPhone || undefined,
      })

      toast({
        title: "Éxito",
        description: "Datos actualizados correctamente",
      })

      await refreshUser()

      setTimeout(() => {
        router.push("/settings")
      }, 1500)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al actualizar los datos",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return {
    user,
    profileData,
    isLoading,
    handleInputChange,
    handleSubmit,
    handleCancel,
  }
}
