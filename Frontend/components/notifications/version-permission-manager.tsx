import React, { useEffect, useState } from 'react'
import { VersionUpdatePermissionDialog, NewVersionToast } from './version-update-permission-dialog'
import { useVersionAwarePermissions } from '@/hooks/notifications/use-version-aware-permissions'

/**
 * Componente que maneja automáticamente la solicitud de permisos por versión
 * 
 * 🎯 Uso recomendado:
 * - Agregarlo al layout principal de la app (layout.tsx o App.tsx)
 * - Se encarga automáticamente de detectar actualizaciones
 * - Muestra diálogos apropiados en el momento correcto
 * - No interfiere con el resto de la aplicación
 */
export function VersionPermissionManager() {
  // Estados locales para UI
  const [showNewVersionToast, setShowNewVersionToast] = useState(false)
  
  // Hook principal que maneja toda la lógica
  const versionPermissions = useVersionAwarePermissions()

  // Efecto para mostrar toast de nueva versión
  useEffect(() => {
    if (versionPermissions.isNewVersionDetected) {
      // Mostrar toast informativo sobre nueva versión
      setShowNewVersionToast(true)
      
      // Auto-ocultar toast después de 5 segundos
      const timer = setTimeout(() => {
        setShowNewVersionToast(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [versionPermissions.isNewVersionDetected])

  return (
    <>
      {/* Diálogo principal de permisos */}
      <VersionUpdatePermissionDialog
        isOpen={versionPermissions.shouldShowPermissionDialog}
        isNewVersion={versionPermissions.isNewVersionDetected}
        currentVersion={versionPermissions.currentVersion}
        onAccept={versionPermissions.handleAcceptPermissions}
        onDecline={versionPermissions.handleDeclinePermissions}
        onDeclinePermanently={versionPermissions.handleDeclinePermissionsPermanently}
        onClose={versionPermissions.hidePermissionDialog}
      />
      
      {/* Toast informativo de nueva versión */}
      {showNewVersionToast && (
        <NewVersionToast
          version={versionPermissions.currentVersion}
          onDismiss={() => setShowNewVersionToast(false)}
        />
      )}
    </>
  )
}

/**
 * Hook para uso manual del sistema de permisos por versión
 * Útil para configuraciones o páginas específicas
 */
export function useManualVersionPermissions() {
  const versionPermissions = useVersionAwarePermissions()
  
  return {
    // Estado
    isNewVersion: versionPermissions.isNewVersionDetected,
    currentVersion: versionPermissions.currentVersion,
    isSubscribed: versionPermissions.pushSubscription.isSubscribed,
    canSubscribe: versionPermissions.pushSubscription.canSubscribe,
    
    // Acciones manuales
    showPermissionDialog: versionPermissions.showPermissionDialogManually,
    subscribeToNotifications: versionPermissions.pushSubscription.subscribe,
    unsubscribeFromNotifications: versionPermissions.pushSubscription.unsubscribe,
    
    // Utilidades de desarrollo
    resetAllPermissions: versionPermissions.resetAllPermissions
  }
}

/**
 * Componente para mostrar estado de suscripción en configuraciones
 */
interface NotificationStatusCardProps {
  className?: string
}

export function NotificationStatusCard({ className = '' }: NotificationStatusCardProps) {
  const manual = useManualVersionPermissions()
  
  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Notificaciones Push</h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          manual.isSubscribed 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {manual.isSubscribed ? 'Activas' : 'Inactivas'}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        {manual.isSubscribed 
          ? 'Recibirás notificaciones de clases, pagos y novedades importantes.'
          : 'Activa las notificaciones para no perderte información importante.'
        }
      </p>

      {/* Información de versión */}
      <div className="text-xs text-gray-500 mb-4">
        Versión actual: {manual.currentVersion}
        {manual.isNewVersion && (
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded">Nueva</span>
        )}
      </div>
      
      <div className="flex gap-2">
        {!manual.isSubscribed && manual.canSubscribe && (
          <button
            onClick={manual.showPermissionDialog}
            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Activar Notificaciones
          </button>
        )}
        
        {manual.isSubscribed && (
          <button
            onClick={manual.unsubscribeFromNotifications}
            className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Desactivar Notificaciones
          </button>
        )}
        
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={manual.resetAllPermissions}
            className="px-3 py-2 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 transition-colors"
          >
            Reset (Dev)
          </button>
        )}
      </div>
    </div>
  )
}