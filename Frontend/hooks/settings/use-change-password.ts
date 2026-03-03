"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useToast } from "@/hooks/use-toast"
import { updateUserPassword } from "@/api/clients/usersApi"

interface PasswordVisibility {
  current: boolean
  new: boolean
  confirm: boolean
}

export function useChangePassword() {
  const { user } = useRequireAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibility>({
    current: false,
    new: false,
    confirm: false,
  })

  const [isLoading, setIsLoading] = useState(false)

  const togglePasswordVisibility = (field: keyof PasswordVisibility) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswords(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const validatePasswords = (): boolean => {
    if (!passwords.current.trim()) {
      toast({ variant: "destructive", title: "Error", description: "La contraseña actual es requerida" })
      return false
    }

    if (!passwords.new.trim()) {
      toast({ variant: "destructive", title: "Error", description: "La nueva contraseña es requerida" })
      return false
    }

    if (passwords.new.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "La nueva contraseña debe tener al menos 6 caracteres" })
      return false
    }

    if (passwords.new !== passwords.confirm) {
      toast({ variant: "destructive", title: "Error", description: "Las contraseñas nuevas no coinciden" })
      return false
    }

    if (passwords.current === passwords.new) {
      toast({ variant: "destructive", title: "Error", description: "La nueva contraseña debe ser diferente a la actual" })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePasswords()) return
    if (!user) return

    setIsLoading(true)

    try {
      await updateUserPassword({
        userId: user.id,
        currentPassword: passwords.current,
        newPassword: passwords.new,
      })

      toast({
        title: "Éxito",
        description: "Contraseña actualizada correctamente",
      })

      setPasswords({ current: "", new: "", confirm: "" })

      setTimeout(() => {
        router.push("/settings")
      }, 1500)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al actualizar la contraseña",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return {
    passwords,
    passwordVisibility,
    isLoading,
    togglePasswordVisibility,
    handlePasswordChange,
    handleSubmit,
    handleCancel,
  }
}
