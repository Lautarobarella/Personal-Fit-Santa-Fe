"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { UserType } from "@/lib/types"

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
    // Check for stored user session
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    console.error("Login attempt with email:", email)
    console.log("Login attempt with password:", password)
    setLoading(true)
    try {
      const { authenticate } = await import("@/lib/auth")
      const authenticatedUser = await authenticate(email, password)

      if (authenticatedUser) {
        console.log("User authenticated successfully:", authenticatedUser)
        setUser(authenticatedUser)
        localStorage.setItem("user", JSON.stringify(authenticatedUser))
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
    localStorage.removeItem("user")
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
