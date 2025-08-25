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

// Función para guardar configuraciones en localStorage
const saveSettingsToLocalStorage = (settings: GlobalSettingsType) => {
  localStorage.setItem('monthly_fee', settings.monthlyFee.toString())
  localStorage.setItem('registration_time_hours', settings.registrationTimeHours.toString())
  localStorage.setItem('unregistration_time_hours', settings.unregistrationTimeHours.toString())
}

// Función para cargar configuraciones desde localStorage
export const getSettingsFromLocalStorage = (): GlobalSettingsType | null => {
  try {
    const monthlyFee = localStorage.getItem('monthly_fee')
    const registrationTime = localStorage.getItem('registration_time_hours')
    const unregistrationTime = localStorage.getItem('unregistration_time_hours')

    if (monthlyFee && registrationTime && unregistrationTime) {
      return {
        monthlyFee: parseFloat(monthlyFee),
        registrationTimeHours: parseInt(registrationTime),
        unregistrationTimeHours: parseInt(unregistrationTime)
      }
    }
    return null
  } catch (error) {
    console.error('Error parsing settings from localStorage:', error)
    return null
  }
}

export const authenticate = async (email: string, password: string): Promise<UserType | null> => {
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
    
    // Store tokens in localStorage
    // TODO: Implement secure token storage for production
    localStorage.setItem('accessToken', authData.accessToken)
    localStorage.setItem('refreshToken', authData.refreshToken)
    localStorage.setItem('user', JSON.stringify(authData.user))

    // Cargar configuraciones globales
    // Si vienen en el JWT, usarlas, sino cargarlas desde las APIs
    let settings: GlobalSettingsType | null = authData.globalSettings || null
    
    if (!settings) {
      settings = await loadGlobalSettings()
    }
    
    if (settings) {
      saveSettingsToLocalStorage(settings)
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
  localStorage.removeItem('user')
  
  // Limpiar configuraciones globales
  localStorage.removeItem('monthly_fee')
  localStorage.removeItem('registration_time_hours')
  localStorage.removeItem('unregistration_time_hours')
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
    
    // Update tokens in localStorage
    localStorage.setItem('accessToken', authData.accessToken)
    localStorage.setItem('refreshToken', authData.refreshToken)
    localStorage.setItem('user', JSON.stringify(authData.user))

    // Actualizar configuraciones si vienen en el refresh
    if (authData.globalSettings) {
      saveSettingsToLocalStorage(authData.globalSettings)
    }

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


