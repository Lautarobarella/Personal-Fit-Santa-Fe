"use client"

import type React from "react"

import { authenticate, logout as authLogout, getCurrentUser, isAuthenticated, revalidateUser } from "@/lib/auth"
import type { UserType } from "@/lib/types"
import { createContext, useContext, useEffect, useState } from "react"

interface AuthContextType {
  user: UserType | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  revalidateUser: () => Promise<void>
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
    setLoading(true)
    try {
      const authenticatedUser = await authenticate(email, password)
      setUser(authenticatedUser)
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
  }

  const handleRevalidateUser = async () => {
    try {
      const updatedUser = await revalidateUser()
      if (updatedUser) {
        setUser(updatedUser)
      }
    } catch (error) {
      console.error('Error revalidating user:', error)
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, loading, revalidateUser: handleRevalidateUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
