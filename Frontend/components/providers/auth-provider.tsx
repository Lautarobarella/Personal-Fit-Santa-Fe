"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { UserType } from "@/lib/types"
import { authenticate, logout as authLogout, getCurrentUser, isAuthenticated } from "@/lib/auth"

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

  useEffect(() => {
    // Check for stored user session and token
    const checkAuth = () => {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("Login attempt with email:", email)
    setLoading(true)
    try {
      const authenticatedUser = await authenticate(email, password)

      if (authenticatedUser) {
        console.log("User authenticated successfully:", authenticatedUser)
        setUser(authenticatedUser)
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    authLogout()
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
