"use client"

import { createPublicUserRegistration } from "@/api/clients/usersApi"
import { useAuth } from "@/contexts/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { UserRole, type UserFormType } from "@/types"
import { useState } from "react"

const EMPTY_REGISTRATION_FORM: UserFormType = {
  dni: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  emergencyPhone: "",
  birthDate: "",
  address: "",
  role: UserRole.CLIENT,
  joinDate: "",
  password: "",
}

export function useLoginForm() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [registrationForm, setRegistrationForm] = useState<UserFormType>(EMPTY_REGISTRATION_FORM)
  const [registrationErrors, setRegistrationErrors] = useState<Partial<UserFormType>>({})
  const [isRegistering, setIsRegistering] = useState(false)

  const { login } = useAuth()
  const { toast } = useToast()

  const validateRegistrationForm = (): boolean => {
    const errors: Partial<UserFormType> = {}

    if (!registrationForm.dni.trim()) errors.dni = "El DNI es requerido"
    if (!registrationForm.firstName.trim()) errors.firstName = "El nombre es requerido"
    if (!registrationForm.lastName.trim()) errors.lastName = "El apellido es requerido"
    if (!registrationForm.email.trim()) errors.email = "El email es requerido"
    else if (!/\S+@\S+\.\S+/.test(registrationForm.email)) errors.email = "Email invalido"
    if (!registrationForm.phone.trim()) errors.phone = "El telefono es requerido"
    if (!registrationForm.birthDate) errors.birthDate = "La fecha de nacimiento es requerida"
    if (!registrationForm.address.trim()) errors.address = "La direccion es requerida"

    if (registrationForm.birthDate) {
      const birthDate = new Date(registrationForm.birthDate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 16) {
        errors.birthDate = "Debes tener al menos 16 anos"
      }
    }

    setRegistrationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const normalizedEmail = email.toLowerCase().trim()
      const success = await login(normalizedEmail, password)
      if (!success) {
        toast({
          title: "Error de autenticación",
          description: "Credenciales incorrectas",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error durante el login"
      toast({
        title: "Error de autenticación",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegistrationInputChange = (field: keyof UserFormType, value: string) => {
    setRegistrationForm((prev) => ({ ...prev, [field]: value }))
    if (registrationErrors[field]) {
      setRegistrationErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateRegistrationForm()) {
      return
    }

    setIsRegistering(true)

    try {
      const payload: UserFormType = {
        ...registrationForm,
        role: UserRole.CLIENT,
        dni: registrationForm.dni.trim(),
        firstName: registrationForm.firstName.trim(),
        lastName: registrationForm.lastName.trim(),
        email: registrationForm.email.toLowerCase().trim(),
        phone: registrationForm.phone.trim(),
        emergencyPhone: registrationForm.emergencyPhone?.trim() || "",
        address: registrationForm.address.trim(),
        password: registrationForm.dni.trim(),
      }

      await createPublicUserRegistration(payload)

      toast({
        title: "Solicitud enviada",
        description: "Tu usuario quedo pendiente de validacion por un administrador.",
      })

      setRegistrationForm(EMPTY_REGISTRATION_FORM)
      setRegistrationErrors({})
      setActiveTab("login")
    } catch {
      // Error toast is handled in the API layer.
    } finally {
      setIsRegistering(false)
    }
  }

  return {
    activeTab,
    setActiveTab,
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleLoginSubmit,
    registrationForm,
    registrationErrors,
    isRegistering,
    handleRegistrationInputChange,
    handleRegistrationSubmit,
  }
}
