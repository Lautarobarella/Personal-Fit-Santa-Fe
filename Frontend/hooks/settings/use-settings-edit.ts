"use client"

import { updateUserPassword, updateUserProfile } from "@/api/clients/usersApi"
import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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

  const [passwordData, setPasswordData] = useState({
    current: "",
    next: "",
    confirm: "",
  })

  const [isLoading, setIsLoading] = useState(false)

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
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const shouldUpdatePassword =
    passwordData.current.trim() !== "" ||
    passwordData.next.trim() !== "" ||
    passwordData.confirm.trim() !== ""

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

    if (shouldUpdatePassword) {
      if (!passwordData.current.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "La contraseña actual es requerida para cambiar la clave",
        })
        return false
      }

      if (!passwordData.next.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "La nueva contraseña es requerida",
        })
        return false
      }

      if (passwordData.next.length < 6) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "La nueva contraseña debe tener al menos 6 caracteres",
        })
        return false
      }

      if (passwordData.next !== passwordData.confirm) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "La confirmación de contraseña no coincide",
        })
        return false
      }

      if (passwordData.current === passwordData.next) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "La nueva contraseña debe ser diferente a la actual",
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !user) return

    setIsLoading(true)

    try {
      await updateUserProfile({
        userId: user.id,
        address: profileData.address,
        phone: profileData.phone,
        emergencyPhone: profileData.emergencyPhone || undefined,
      })

      if (shouldUpdatePassword) {
        await updateUserPassword({
          userId: user.id,
          currentPassword: passwordData.current,
          newPassword: passwordData.next,
        })
      }

      toast({
        title: "Éxito",
        description: shouldUpdatePassword
          ? "Datos y contraseña actualizados correctamente"
          : "Datos actualizados correctamente",
      })

      await refreshUser()
      setPasswordData({ current: "", next: "", confirm: "" })

      setTimeout(() => {
        router.push("/settings")
      }, 1500)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al actualizar el perfil",
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
    passwordData,
    shouldUpdatePassword,
    isLoading,
    handleInputChange,
    handlePasswordChange,
    handleSubmit,
    handleCancel,
  }
}
