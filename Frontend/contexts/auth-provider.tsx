"use client"

import type React from "react"

import { authenticate, logout as authLogout, isAuthenticated, getUserId } from "@/lib/auth"
import { fetchCurrentUserById } from "@/api/clients/usersApi"
import type { UserType } from "@/lib/types"
import { createContext, useContext, useEffect, useState } from "react"

/**
 * Authentication Context Interface
 * 
 * Defines the shape of the context object provided to the entire application.
 * This is the contract that consumers (via useAuth hook) can rely on.
 */
interface AuthContextType {
  /** The currently authenticated user object, or null if guest/not logged in. */
  user: UserType | null

  /**
   * Performance synchronous login.
   * @param email User's email address
   * @param password User's raw password
   * @returns {Promise<boolean>} True if login was successful
   */
  login: (email: string, password: string) => Promise<boolean>

  /**
   * Logs out the current user and clears session data.
   * @param deviceToken Optional. If provided, it can be used to deregister push notifications on the backend.
   */
  logout: (deviceToken?: string) => void

  /** True while the initial session check is running. Used to show a loading spinner/skeleton. */
  loading: boolean

  /**
   * Manually triggers a re-fetch of the user profile from the API.
   * Useful when user details (e.g., profile picture, name) are updated elsewhere in the app.
   */
  refreshUser: () => Promise<void>
}

// Create the context with undefined initial value.
// We force usage via the useAuth hook which handles the undefined check.
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider Component
 * 
 * Root provider that manages:
 * 1. Global user state
 * 2. Session persistence (via localStorage/cookies handled in @/lib/auth)
 * 3. Initial session restoration on page load
 * 
 * Wrap the root application component with this provider.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Function: Refresh User Data
   * 
   * Reloads the full user profile object from the backend using the stored User ID.
   * Used during initialization and after profile edits.
   */
  const refreshUser = async () => {
    if (isAuthenticated()) {
      const userId = getUserId()
      if (userId) {
        try {
          const currentUser = await fetchCurrentUserById(userId)
          setUser(currentUser)
        } catch (error) {
          console.error("Error refreshing user:", error)
          // Security Fallback: If we can't fetch the user despite having a token, 
          // the session state is likely corrupted or the user was deleted.
          // Force logout to clean up.
          setUser(null)
          authLogout()
        }
      } else {
        // Token exists but no User ID found - invalid state
        setUser(null)
        authLogout()
      }
    } else {
      setUser(null)
    }
  }

  /**
   * Effect: Session Initialization
   * 
   * Runs once on mount to check if a valid session exists in storage.
   * If yes, it hydrates the user state.
   */
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        const userId = getUserId()
        if (userId) {
          try {
            // Hydrate user profile
            const currentUser = await fetchCurrentUserById(userId)
            setUser(currentUser)
          } catch (error) {
            console.error("Error fetching current user:", error)
            // Invalid session handling
            setUser(null)
            authLogout()
          }
        } else {
          // Token valid but missing ID metadata
          setUser(null)
        }
      } else {
        // No token found
        setUser(null)
      }
      // Critical: finished loading state allows the router to process protected routes
      setLoading(false)
    }

    checkAuth()
  }, [])

  /**
   * Login Handler
   * Bridges the UI form with the auth library and updates local state on success.
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    try {
      const authenticatedUser = await authenticate(email, password)
      setUser(authenticatedUser)
      return true
    } catch (error) {
      console.error("Login error:", error)
      throw error // Propagate error for UI feedback (e.g. "Invalid credentials" toast)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Logout Handler
   * Clears state and persists logout to storage.
   */
  const logout = (deviceToken?: string) => {
    setUser(null)
    authLogout(deviceToken)
  }

  return <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>{children}</AuthContext.Provider>
}

/**
 * useAuth Hook
 * 
 * Custom hook to consume the AuthContext.
 * Throws a clear error if used outside the provider boundary.
 * 
 * @returns {AuthContextType} The auth context values
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
