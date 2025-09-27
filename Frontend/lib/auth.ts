import { API_CONFIG } from "../api/JWTAuth/config"
import type { GlobalSettingsType, UserRole, UserType } from "./types"

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: UserType
  globalSettings?: GlobalSettingsType
}

const loadGlobalSettings = async (): Promise<GlobalSettingsType | null> => {
  try {
    const { fetchAllSettings } = await import('../api/settings/settingsApi')
    return await fetchAllSettings()
  } catch (error) {
    console.error('Error loading global settings:', error)
    return null
  }
}

export const authenticate = async (email: string, password: string): Promise<UserType> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Importante para cookies httpOnly
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
    
    localStorage.setItem('userId', authData.user.id.toString())
    let settings: GlobalSettingsType | null = authData.globalSettings || null
    
    if (!settings) {
      settings = await loadGlobalSettings()
    }

    return authData.user
  } catch (error) {
    console.error('Authentication error:', error)
    throw error // Re-throw to let the calling code handle it
  }
}

export const logout = async (deviceToken?: string): Promise<void> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Incluir token del dispositivo si está disponible para desactivarlo
    if (deviceToken) {
      headers['Device-Token'] = deviceToken;
    }

    await fetch(`${API_CONFIG.BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers,
    })
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    localStorage.removeItem('userId')
  }
}

export const getUserId = (): number | null => {
  const userIdStr = localStorage.getItem('userId')
  return userIdStr ? parseInt(userIdStr, 10) : null
}

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      console.error('Token refresh failed:', response.statusText)
      logout()
      return null
    }

    const authData: AuthResponse = await response.json()
    
    localStorage.setItem('userId', authData.user.id.toString())

    return authData.accessToken
  } catch (error) {
    console.error('Token refresh error:', error)
    logout()
    return null
  }
}

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    ADMIN: 3,
    TRAINER: 2,
    CLIENT: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export const isAuthenticated = (): boolean => {
  return getUserId() !== null
}
