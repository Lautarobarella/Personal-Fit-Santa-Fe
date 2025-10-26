import { useEffect, useState, useCallback } from 'react'
import { useVersionPermissionManager } from './use-version-permission-manager'
import { usePushNotificationSubscription } from './use-push-notifications'

interface UseVersionAwarePermissionsReturn {
  // Estado del diálogo
  shouldShowPermissionDialog: boolean
  isNewVersionDetected: boolean
  currentVersion: string
  
  // Estado de loading
  isRequestingPermission: boolean
  
  // Acciones del diálogo
  handleAcceptPermissions: () => Promise<void>
  handleDeclinePermissions: () => void
  handleDeclinePermissionsPermanently: () => void
  hidePermissionDialog: () => void
  
  // Utilidades
  showPermissionDialogManually: () => void
  resetAllPermissions: () => void
  
  // Estado de las notificaciones push
  pushSubscription: ReturnType<typeof usePushNotificationSubscription>
}

/**
 * Hook maestro que combina gestión de versiones y permisos de notificaciones
 * 
 * 🎯 Funcionalidad principal:
 * - Detecta automáticamente actualizaciones de app
 * - Muestra diálogo de permisos cuando es apropiado
 * - Integra con el sistema de suscripciones push
 * - Maneja todos los estados de forma coordinada
 * 
 * 📋 Casos de uso:
 * - Usuario abre app después de actualización → Muestra diálogo automáticamente
 * - Usuario acepta permisos → Se suscribe a notificaciones push
 * - Usuario rechaza → Respeta decisión y guarda estado
 * - Desarrollador quiere mostrar diálogo manualmente → Método disponible
 */
export function useVersionAwarePermissions(): UseVersionAwarePermissionsReturn {
  // Estados locales
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [dialogVisible, setDialogVisible] = useState(false)
  
  // Hooks especializados
  const versionManager = useVersionPermissionManager()
  const pushSubscription = usePushNotificationSubscription()

  // Efecto para mostrar diálogo automáticamente cuando sea necesario
  useEffect(() => {
    // Pequeño delay para evitar mostrar diálogo antes de que la UI esté lista
    const timer = setTimeout(() => {
      if (versionManager.shouldShowPermissionRequest) {
        setDialogVisible(true)
      }
    }, 1000) // 1 segundo de delay

    return () => clearTimeout(timer)
  }, [versionManager.shouldShowPermissionRequest])

  /**
   * Maneja la aceptación de permisos
   * 1. Solicita permisos del navegador
   * 2. Si se conceden, se suscribe a notificaciones push  
   * 3. Marca permisos como concedidos para esta versión
   */
  const handleAcceptPermissions = useCallback(async () => {
    setIsRequestingPermission(true)
    
    try {
      // Intentar suscribirse a notificaciones push
      const result = await pushSubscription.subscribe()
      
      if (result.success) {
        // Marcar permisos como concedidos para esta versión
        versionManager.markPermissionGranted()
        setDialogVisible(false)
        
        // Opcional: Mostrar toast de éxito
        console.log('✅ Notificaciones activadas exitosamente')
      } else {
        // El usuario rechazó permisos en el navegador
        console.log('⚠️ Usuario rechazó permisos en el navegador:', result.message)
        
        // Marcar como rechazado temporalmente
        versionManager.markPermissionDismissed()
        setDialogVisible(false)
      }
    } catch (error) {
      console.error('❌ Error al solicitar permisos de notificación:', error)
      
      // En caso de error, marcar como rechazado temporalmente
      versionManager.markPermissionDismissed()
      setDialogVisible(false)
    } finally {
      setIsRequestingPermission(false)
    }
  }, [pushSubscription, versionManager])

  /**
   * Maneja el rechazo temporal de permisos
   * Se volverá a solicitar en la próxima sesión de la misma versión
   */
  const handleDeclinePermissions = useCallback(() => {
    versionManager.markPermissionDismissed()
    setDialogVisible(false)
    console.log('⏭️ Usuario pospuso permisos de notificación')
  }, [versionManager])

  /**
   * Maneja el rechazo permanente de permisos
   * No se volverá a solicitar hasta la próxima actualización mayor
   */
  const handleDeclinePermissionsPermanently = useCallback(() => {
    versionManager.markDismissedPermanently()
    setDialogVisible(false)
    console.log('🚫 Usuario rechazó permisos de notificación permanentemente')
  }, [versionManager])

  /**
   * Oculta el diálogo sin cambiar estado de permisos
   */
  const hidePermissionDialog = useCallback(() => {
    setDialogVisible(false)
  }, [])

  /**
   * Muestra el diálogo de permisos manualmente
   * Útil para configuraciones o re-activación manual
   */
  const showPermissionDialogManually = useCallback(() => {
    setDialogVisible(true)
  }, [])

  /**
   * Resetea completamente todos los permisos y estados
   * Útil para desarrollo/testing o reinstalación limpia
   */
  const resetAllPermissions = useCallback(() => {
    versionManager.resetPermissionState()
    setDialogVisible(false)
    setIsRequestingPermission(false)
    console.log('🔄 Estado de permisos reseteado completamente')
  }, [versionManager])

  // Logging para desarrollo (remover en producción)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔔 Version Permission Manager State:', {
        shouldShowPermissionDialog: dialogVisible,
        isNewVersionDetected: versionManager.isNewVersionDetected,
        currentVersion: versionManager.currentVersion,
        lastPermissionVersion: versionManager.lastPermissionVersion,
        hasUserDismissedPermanently: versionManager.hasUserDismissedPermanently,
        isSubscribed: pushSubscription.isSubscribed,
        canSubscribe: pushSubscription.canSubscribe
      })
    }
  }, [
    dialogVisible,
    versionManager.isNewVersionDetected,
    versionManager.currentVersion,
    versionManager.lastPermissionVersion,
    versionManager.hasUserDismissedPermanently,
    pushSubscription.isSubscribed,
    pushSubscription.canSubscribe
  ])

  return {
    // Estado del diálogo
    shouldShowPermissionDialog: dialogVisible,
    isNewVersionDetected: versionManager.isNewVersionDetected,
    currentVersion: versionManager.currentVersion,
    
    // Estado de loading
    isRequestingPermission,
    
    // Acciones del diálogo
    handleAcceptPermissions,
    handleDeclinePermissions,
    handleDeclinePermissionsPermanently,
    hidePermissionDialog,
    
    // Utilidades
    showPermissionDialogManually,
    resetAllPermissions,
    
    // Estado de las notificaciones push
    pushSubscription
  }
}

/**
 * Hook simple para detectar solo actualizaciones de versión (sin UI)
 * Útil para analytics o logging
 */
export function useVersionDetection() {
  const versionManager = useVersionPermissionManager()
  
  useEffect(() => {
    if (versionManager.isNewVersionDetected) {
      // Registrar actualización para analytics
      console.log(`🚀 App actualizada a versión ${versionManager.currentVersion}`)
      
      // Opcional: Enviar evento a analytics
      // analytics.track('app_updated', { 
      //   version: versionManager.currentVersion,
      //   previousVersion: versionManager.lastPermissionVersion 
      // })
    }
  }, [versionManager.isNewVersionDetected, versionManager.currentVersion, versionManager.lastPermissionVersion])

  return {
    isNewVersion: versionManager.isNewVersionDetected,
    currentVersion: versionManager.currentVersion,
    previousVersion: versionManager.lastPermissionVersion
  }
}