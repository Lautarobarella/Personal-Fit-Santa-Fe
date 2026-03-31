import { buildApiUrl } from "../api/JWTAuth/config"
import type { UserRole, UserType } from "./types"

/**
 * Interface definition for the JWT Authentication Payload.
 * Corresponds to the standard JWT Bearer Token response structure.
 */
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: UserType
  globalSettings?: any
}

/**
 * Core Authentication Function.
 * Exchanges credentials for a session token and persists user state.
 * Settings are now embedded directly in the auth response by the backend.
 * 
 * @param email 
 * @param password 
 * @returns The authenticated User object
 * @throws Error if credentials are invalid or network fails
 */
export const authenticate = async (email: string, password: string): Promise<UserType> => {
  try {
    const response = await fetch(buildApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Important: 'include' credentials ensures httpOnly cookies (RefreshToken) are correctly handled by the browser
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      // Robust error handling: Attempt to extract backend error message, fallback to generic
      try {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Credenciales incorrectas')
      } catch (parseError) {
        throw new Error('Error de autenticación')
      }
    }

    const authData: AuthResponse = await response.json()

    // Persistence: Store minimal identity markers in LocalStorage for session recovery
    localStorage.setItem('userId', authData.user.id.toString())
    if (authData.globalSettings) {
      localStorage.setItem('globalSettings', JSON.stringify(authData.globalSettings))
    }

    return authData.user
  } catch (error) {
    console.error('Authentication error:', error)
    throw error // Propagate to UI layer
  }
}


/**
 * Session Termination.
 * Clears local state and invalidates the session on the server.
 * 
 * @param deviceToken Optional. Used to clean up Push Notification registrations on logout.
 */
export const logout = async (deviceToken?: string): Promise<void> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (deviceToken) {
      headers['Device-Token'] = deviceToken;
    }

    await fetch(buildApiUrl('/api/auth/logout'), {
      method: 'POST',
      credentials: 'include', // Sends the RefreshToken cookie to be invalidated
      headers,
    })
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Always clean up local state, even if server request fails (optimistic logout)
    localStorage.removeItem('userId')
    localStorage.removeItem('globalSettings')
  }
}

/**
 * Retrieves the currently stored User ID.
 * Used for session restoration on page reload.
 */
export const getUserId = (): number | null => {
  const userIdStr = localStorage.getItem('userId')
  return userIdStr ? parseInt(userIdStr, 10) : null
}

/**
 * Token Refresh Mechanism.
 * Called automatically by API interceptors (axios/fetch wrappers) when AccessToken expires.
 * Uses the HTTP-Only cookie to request a new AccessToken.
 * 
 * @returns The new AccessToken string or null if session is completely dead.
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  if (!isAuthenticated()) {
    return null
  }

  try {
    const response = await fetch(buildApiUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      console.error('Token refresh failed:', response.statusText)
      // Force logout if we can't refresh (e.g., RefreshToken expired too)
      logout()
      return null
    }

    const authData: AuthResponse = await response.json()

    // Update local persistence
    localStorage.setItem('userId', authData.user.id.toString())
    if (authData.globalSettings) {
      localStorage.setItem('globalSettings', JSON.stringify(authData.globalSettings))
    }

    return authData.accessToken
  } catch (error) {
    console.error('Token refresh error:', error)
    logout()
    return null
  }
}

/**
 * Role-Based Access Control (RBAC) Checker.
 * Determines if a user meets the minimum role requirement.
 * 
 * @param userRole Current user's role
 * @param requiredRole Minimum required role level
 */
export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    ADMIN: 3,
    TRAINER: 2,
    CLIENT: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Basic authentication check.
 * Relies on the presence of the User ID in storage.
 */
export const isAuthenticated = (): boolean => {
  return getUserId() !== null
}
