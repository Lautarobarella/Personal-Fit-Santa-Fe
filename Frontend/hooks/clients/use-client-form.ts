"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useClients } from "@/hooks/clients/use-client"
import { useToast } from "@/hooks/use-toast"
import type { UserFormType } from "@/types"

export function useClientForm() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  useRequireAuth()
  const { form, setForm, createClient } = useClients()
  const [errors, setErrors] = useState<Partial<UserFormType>>({})

  const validateForm = (formData: UserFormType): boolean => {
    const newErrors: Partial<UserFormType> = {}

    if (!formData.dni.trim()) newErrors.dni = "El DNI es requerido"
    if (!formData.firstName.trim()) newErrors.firstName = "El nombre es requerido"
    if (!formData.lastName.trim()) newErrors.lastName = "El nombre es requerido"
    if (!formData.email.trim()) newErrors.email = "El email es requerido"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email inválido"
    if (!formData.phone.trim()) newErrors.phone = "El teléfono es requerido"
    if (!formData.birthDate) newErrors.birthDate = "La fecha de nacimiento es requerida"
    if (!formData.address.trim()) newErrors.address = "La dirección es requerida"
    if (!formData.password.trim()) newErrors.password = "La contraseña es requerida"

    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 16) {
        newErrors.birthDate = "El cliente debe tener al menos 16 años"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: UserFormType = {
      ...form,
      password: form.dni.toString(),
    }
    if (!validateForm(payload)) return

    setIsLoading(true)
    try {
      const response = await createClient(payload)
      toast({
        title: "Éxito",
        description: response?.message || "El cliente ha sido registrado exitosamente",
      })
      router.push("/clients")
    } catch {
      toast({
        title: "Error",
        description: "No se pudo crear el cliente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserFormType, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return {
    user,
    router,
    isLoading,
    form,
    errors,
    handleSubmit,
    handleInputChange,
  }
}
