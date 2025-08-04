import type { UserType, UserRole } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: UserType
}

export const authenticate = async (email: string, password: string): Promise<UserType | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      // Try to parse error response from backend
      try {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Credenciales incorrectas')
      } catch (parseError) {
        throw new Error('Error de autenticación')
      }
    }

    const authData: AuthResponse = await response.json()
    
    // Store tokens in localStorage
    // TODO: Implement secure token storage for production
    localStorage.setItem('accessToken', authData.accessToken)
    localStorage.setItem('refreshToken', authData.refreshToken)
    localStorage.setItem('user', JSON.stringify(authData.user))

    return authData.user
  } catch (error) {
    console.error('Authentication error:', error)
    throw error // Re-throw to let the calling code handle it
  }
}

export const logout = (): void => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

export const getCurrentUser = (): UserType | null => {
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr)
  } catch (error) {
    console.error('Error parsing user from localStorage:', error)
    return null
  }
}

export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken')
}

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return null

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh?refreshToken=${refreshToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Token refresh failed:', response.statusText)
      logout()
      return null
    }

    const authData: AuthResponse = await response.json()
    
    // Update tokens in localStorage
    localStorage.setItem('accessToken', authData.accessToken)
    localStorage.setItem('refreshToken', authData.refreshToken)
    localStorage.setItem('user', JSON.stringify(authData.user))

    return authData.accessToken
  } catch (error) {
    console.error('Token refresh error:', error)
    logout()
    return null
  }
}

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    admin: 3,
    trainer: 2,
    client: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export const isAuthenticated = (): boolean => {
  return getAccessToken() !== null
}
