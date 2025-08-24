"use client"

import type React from "react"

import { authenticate, logout as authLogout, getCurrentUser, isAuthenticated } from "@/lib/auth"
import { useSettings } from "@/hooks/settings/use-settings"
import type { UserType } from "@/lib/types"
import { createContext, useContext, useEffect, useState } from "react"

interface AuthContextType {
  user: UserType | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const { reloadSettings } = useSettings()

  useEffect(() => {
    // Check for stored user session and token
    const checkAuth = async () => {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          // Cargar configuraciones cuando se encuentra una sesión activa
          try {
            await reloadSettings()
          } catch (error) {
            console.error("Error loading settings on auth check:", error)
          }
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [reloadSettings])

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    try {
      const authenticatedUser = await authenticate(email, password)
      setUser(authenticatedUser)
      
      // Cargar configuraciones inmediatamente después del login exitoso
      try {
        await reloadSettings()
      } catch (error) {
        console.error("Error loading settings after login:", error)
        // No fallar el login si las configuraciones fallan
      }
      
      return true
    } catch (error) {
      console.error("Login error:", error)
      throw error // Re-throw to let the login form handle the error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    authLogout()
    
    // Limpiar configuraciones del localStorage al cerrar sesión
    localStorage.removeItem('registration_time_hours')
    localStorage.removeItem('unregistration_time_hours')
  }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
