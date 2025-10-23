"use client"

import type React from "react"

import { authenticate, logout as authLogout, isAuthenticated, getUserId } from "@/lib/auth"
import { fetchCurrentUserById } from "@/api/clients/usersApi"
import type { UserType } from "@/lib/types"
import { createContext, useContext, useEffect, useState } from "react"

interface AuthContextType {
  user: UserType | null
  login: (email: string, password: string) => Promise<boolean>
  logout: (deviceToken?: string) => void
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)

  // Función para refrescar los datos del usuario desde la API usando el ID guardado
  const refreshUser = async () => {
    if (isAuthenticated()) {
      const userId = getUserId()
      if (userId) {
        try {
          const currentUser = await fetchCurrentUserById(userId)
          setUser(currentUser)
        } catch (error) {
          console.error("Error refreshing user:", error)
          // Si hay error al obtener el usuario, probablemente el token sea inválido
          setUser(null)
          authLogout()
        }
      } else {
        setUser(null)
        authLogout()
      }
    } else {
      setUser(null)
    }
  }

  useEffect(() => {
    // Verificamos si hay un token válido y un ID de usuario guardado
    const checkAuth = async () => {
      if (isAuthenticated()) {
        const userId = getUserId()
        if (userId) {
          try {
            // Obtener el usuario actual usando el ID guardado
            const currentUser = await fetchCurrentUserById(userId)
            setUser(currentUser)
          } catch (error) {
            console.error("Error fetching current user:", error)
            // Si hay error al obtener el usuario, probablemente el token sea inválido
            setUser(null)
            authLogout()
          }
        } else {
          console.log("No user ID found in localStorage")
          setUser(null)
        }
      } else {
        console.log("User is not authenticated")
        setUser(null)
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    try {
      const authenticatedUser = await authenticate(email, password)
      setUser(authenticatedUser)
      return true
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = (deviceToken?: string) => {
    setUser(null)
    authLogout(deviceToken)
  }

  return <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
