import { API_CONFIG } from "../api/JWTAuth/config"
import type { UserRole, UserType, GlobalSettingsType } from "./types"

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: UserType
  globalSettings?: GlobalSettingsType
}

// Función para cargar todas las configuraciones globales
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
    
    // Guardamos los tokens y el ID del usuario (solo el ID, no todos los datos)
    localStorage.setItem('accessToken', authData.accessToken)
    localStorage.setItem('refreshToken', authData.refreshToken)
    localStorage.setItem('userId', authData.user.id.toString())

    // Cargar configuraciones globales
    // Las configuraciones ahora se manejan a través del contexto SettingsProvider
    // No necesitamos guardarlas en localStorage ya que el contexto las cargará desde la DB
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

export const logout = (): void => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userId')
}

export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken')
}

export const getUserId = (): number | null => {
  const userIdStr = localStorage.getItem('userId')
  return userIdStr ? parseInt(userIdStr, 10) : null
}

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return null

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/refresh?refreshToken=${refreshToken}`, {
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
    
    // Solo actualizamos los tokens y el ID del usuario
    localStorage.setItem('accessToken', authData.accessToken)
    localStorage.setItem('refreshToken', authData.refreshToken)
    localStorage.setItem('userId', authData.user.id.toString())

    // Las configuraciones ahora se manejan a través del contexto SettingsProvider
    // No necesitamos guardarlas en localStorage

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
  return getAccessToken() !== null
}


