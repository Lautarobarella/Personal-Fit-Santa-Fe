import React, { useState } from 'react'
import { X, Bell, Sparkles, Zap } from 'lucide-react'

interface VersionUpdatePermissionDialogProps {
  isOpen: boolean
  isNewVersion: boolean
  currentVersion: string
  onAccept: () => void
  onDecline: () => void
  onDeclinePermanently: () => void
  onClose: () => void
}

/**
 * Diálogo elegante para solicitar permisos de notificaciones después de actualizaciones
 * 
 * 🎨 Características:
 * - Diseño moderno y atractivo
 * - Explica beneficios de las notificaciones
 * - Diferentes mensajes para nueva versión vs. primera instalación
 * - Opciones granulares: Aceptar, Rechazar temporalmente, Rechazar permanentemente
 * - Animaciones suaves y responsive
 */
export function VersionUpdatePermissionDialog({
  isOpen,
  isNewVersion,
  currentVersion,
  onAccept,
  onDecline,
  onDeclinePermanently,
  onClose
}: VersionUpdatePermissionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      await onAccept()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecline = () => {
    onDecline()
    onClose()
  }

  const handleDeclinePermanently = () => {
    onDeclinePermanently()
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Dialog */}
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Gradiente decorativo */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Contenido */}
          <div className="p-6 pt-8">
            {/* Icono y título */}
            <div className="text-center mb-6">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 relative">
                  <Bell className="w-8 h-8 text-white" />
                  {isNewVersion && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {isNewVersion ? (
                  <>¡Nueva versión {currentVersion}!</>
                ) : (
                  <>Mantente Conectado</>
                )}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {isNewVersion ? (
                  <>Hemos mejorado las notificaciones. Actívalas nuevamente para no perderte ninguna novedad importante del gym.</>
                ) : (
                  <>Recibe recordatorios de clases, avisos de pagos y novedades importantes directamente en tu dispositivo.</>
                )}
              </p>
            </div>

            {/* Beneficios */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Recordatorios de clases</h4>
                  <p className="text-gray-600 text-xs">No te pierdas tus entrenamientos programados</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Avisos de pagos</h4>
                  <p className="text-gray-600 text-xs">Recordatorios antes del vencimiento</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Novedades y promociones</h4>
                  <p className="text-gray-600 text-xs">Entérate de ofertas especiales y eventos</p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="space-y-3">
              {/* Botón principal - Activar */}
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Activando...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Activar Notificaciones
                  </>
                )}
              </button>

              {/* Botones secundarios */}
              <div className="flex gap-2">
                <button
                  onClick={handleDecline}
                  className="flex-1 text-gray-600 font-medium py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                >
                  Más tarde
                </button>
                <button
                  onClick={handleDeclinePermanently}
                  className="flex-1 text-gray-500 font-medium py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                >
                  No mostrar más
                </button>
              </div>
            </div>

            {/* Nota de privacidad */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Puedes cambiar estas preferencias en cualquier momento desde Configuración
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Toast sutil para mostrar cuando se detecta una nueva versión
 */
interface NewVersionToastProps {
  version: string
  onDismiss: () => void
}

export function NewVersionToast({ version, onDismiss }: NewVersionToastProps) {
  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50 animate-in slide-in-from-right duration-300">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm">¡App Actualizada!</h4>
          <p className="text-gray-600 text-xs mt-1">
            Ahora estás usando la versión {version} con mejoras y nuevas funcionalidades.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  )
}