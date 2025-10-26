import { useEffect, useState, useCallback } from 'react'

// Versión actual de la app (actualizar con cada release)
const CURRENT_APP_VERSION = '1.3.0' // 🚀 Actualizar esto con cada nueva versión

// Claves para localStorage
const STORAGE_KEYS = {
  LAST_PERMISSION_VERSION: 'pf_last_permission_version',
  PERMISSION_GRANTED_VERSION: 'pf_permission_granted_version',
  PERMISSION_DISMISSED_VERSION: 'pf_permission_dismissed_version',
  USER_HAS_DISMISSED_PERMANENTLY: 'pf_user_dismissed_permanently'
} as const

interface VersionPermissionState {
  shouldShowPermissionRequest: boolean
  isNewVersionDetected: boolean
  currentVersion: string
  lastPermissionVersion: string | null
  hasUserDismissedPermanently: boolean
}

interface VersionPermissionActions {
  markPermissionGranted: () => void
  markPermissionDismissed: () => void
  markDismissedPermanently: () => void
  resetPermissionState: () => void
  checkVersionUpdate: () => boolean
}

/**
 * Hook para manejar re-solicitud de permisos en nuevas versiones
 * 
 * 🎯 Funcionalidad:
 * - Detecta automáticamente nuevas versiones de la app
 * - Re-solicita permisos de notificaciones después de actualizaciones
 * - Respeta las preferencias del usuario (no molesta si rechazó permanentemente)
 * - Almacena estado en localStorage para persistencia
 * 
 * 📋 Casos de uso:
 * - Usuario actualiza la app → Se solicitan permisos nuevamente
 * - Usuario acepta → No se vuelve a solicitar hasta próxima actualización
 * - Usuario rechaza temporalmente → Se solicita en próxima sesión de la misma versión
 * - Usuario rechaza permanentemente → No se solicita más hasta próxima actualización mayor
 */
export function useVersionPermissionManager(): VersionPermissionState & VersionPermissionActions {
  const [state, setState] = useState<VersionPermissionState>(() => {
    // Estado inicial basado en localStorage
    const lastPermissionVersion = localStorage.getItem(STORAGE_KEYS.LAST_PERMISSION_VERSION)
    const permissionGrantedVersion = localStorage.getItem(STORAGE_KEYS.PERMISSION_GRANTED_VERSION)
    const permissionDismissedVersion = localStorage.getItem(STORAGE_KEYS.PERMISSION_DISMISSED_VERSION)
    const hasUserDismissedPermanently = localStorage.getItem(STORAGE_KEYS.USER_HAS_DISMISSED_PERMANENTLY) === 'true'

    // Detectar si es una nueva versión
    const isNewVersionDetected = lastPermissionVersion !== CURRENT_APP_VERSION

    // Determinar si debe mostrar solicitud de permisos
    let shouldShowPermissionRequest = false

    if (isNewVersionDetected && !hasUserDismissedPermanently) {
      // Es nueva versión y usuario no ha rechazado permanentemente
      shouldShowPermissionRequest = true
    } else if (!isNewVersionDetected && permissionDismissedVersion === CURRENT_APP_VERSION) {
      // Misma versión, pero usuario rechazó temporalmente
      shouldShowPermissionRequest = true
    } else if (!permissionGrantedVersion && !hasUserDismissedPermanently) {
      // Usuario nuevo sin permisos concedidos
      shouldShowPermissionRequest = true
    }

    return {
      shouldShowPermissionRequest,
      isNewVersionDetected,
      currentVersion: CURRENT_APP_VERSION,
      lastPermissionVersion,
      hasUserDismissedPermanently
    }
  })

  // Efecto para actualizar la versión en localStorage
  useEffect(() => {
    // Actualizar última versión conocida
    if (state.lastPermissionVersion !== CURRENT_APP_VERSION) {
      localStorage.setItem(STORAGE_KEYS.LAST_PERMISSION_VERSION, CURRENT_APP_VERSION)
      
      // Si es nueva versión, limpiar rechazos temporales (pero no permanentes)
      if (state.isNewVersionDetected) {
        localStorage.removeItem(STORAGE_KEYS.PERMISSION_DISMISSED_VERSION)
      }
    }
  }, [state.lastPermissionVersion, state.isNewVersionDetected])

  /**
   * Marcar que el usuario concedió permisos
   */
  const markPermissionGranted = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.PERMISSION_GRANTED_VERSION, CURRENT_APP_VERSION)
    localStorage.removeItem(STORAGE_KEYS.PERMISSION_DISMISSED_VERSION)
    localStorage.removeItem(STORAGE_KEYS.USER_HAS_DISMISSED_PERMANENTLY)
    
    setState(prev => ({
      ...prev,
      shouldShowPermissionRequest: false,
      hasUserDismissedPermanently: false
    }))
  }, [])

  /**
   * Marcar que el usuario rechazó permisos temporalmente
   * (se volverá a solicitar en próxima sesión de la misma versión)
   */
  const markPermissionDismissed = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.PERMISSION_DISMISSED_VERSION, CURRENT_APP_VERSION)
    
    setState(prev => ({
      ...prev,
      shouldShowPermissionRequest: false
    }))
  }, [])

  /**
   * Marcar que el usuario rechazó permisos permanentemente
   * (no se solicitará más hasta próxima actualización mayor)
   */
  const markDismissedPermanently = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.USER_HAS_DISMISSED_PERMANENTLY, 'true')
    localStorage.setItem(STORAGE_KEYS.PERMISSION_DISMISSED_VERSION, CURRENT_APP_VERSION)
    
    setState(prev => ({
      ...prev,
      shouldShowPermissionRequest: false,
      hasUserDismissedPermanently: true
    }))
  }, [])

  /**
   * Resetear completamente el estado de permisos
   * (útil para testing o reinstalación limpia)
   */
  const resetPermissionState = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    
    setState(prev => ({
      ...prev,
      shouldShowPermissionRequest: true,
      hasUserDismissedPermanently: false,
      lastPermissionVersion: null
    }))
  }, [])

  /**
   * Verificar manualmente si hay actualización de versión
   */
  const checkVersionUpdate = useCallback(() => {
    const lastVersion = localStorage.getItem(STORAGE_KEYS.LAST_PERMISSION_VERSION)
    return lastVersion !== CURRENT_APP_VERSION
  }, [])

  return {
    // Estado
    ...state,
    
    // Acciones
    markPermissionGranted,
    markPermissionDismissed,
    markDismissedPermanently,
    resetPermissionState,
    checkVersionUpdate
  }
}

/**
 * Comparador semántico de versiones
 * Determina si una versión es mayor que otra (ej: "1.2.0" > "1.1.5")
 */
export function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number)
  const v2Parts = version2.split('.').map(Number)
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0
    
    if (v1Part > v2Part) return 1
    if (v1Part < v2Part) return -1
  }
  
  return 0 // Son iguales
}

/**
 * Determinar si una actualización es "mayor" (requiere re-solicitar permisos)
 * - Cambio de versión mayor (1.x.x → 2.x.x): Siempre re-solicitar
 * - Cambio de versión menor (1.1.x → 1.2.x): Re-solicitar
 * - Cambio de patch (1.1.1 → 1.1.2): No re-solicitar (opcional)
 */
export function isMajorUpdate(fromVersion: string, toVersion: string): boolean {
  const from = fromVersion.split('.').map(Number)
  const to = toVersion.split('.').map(Number)
  
  // Cambio en versión mayor o menor
  return (to[0] > from[0]) || (to[0] === from[0] && to[1] > from[1])
}