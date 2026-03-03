"use client"

import { useAuth } from "@/contexts/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export function useLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
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

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleSubmit,
  }
}
