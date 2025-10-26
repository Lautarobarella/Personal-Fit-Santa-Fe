import { useState, useCallback, useEffect } from "react"
import type { NotificationPreferencesEntity } from "@/lib/notifications/domain/types"
import { jwtPermissionsApi } from "@/api/JWTAuth/api"
import { handleApiError } from "@/lib/error-handler"

/**
 * Hook for managing notification preferences
 * Handles loading, updating, and caching preferences
 */
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferencesEntity | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load preferences
  const loadPreferences = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const prefs: NotificationPreferencesEntity = await jwtPermissionsApi.get('/api/notifications/pwa/preferences')
      setPreferences(prefs)
    } catch (error) {
      console.error("Error loading notification preferences:", error)
      const message = 'Error al cargar preferencias de notificaciones'
      setError(message)
      handleApiError(error, message)
      
      // Set default preferences on error
      setPreferences({
        classReminders: true,
        paymentDue: true,
        newClasses: true,
        promotions: false,
        classCancellations: true,
        generalAnnouncements: true,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update preferences
  const updatePreferences = useCallback(async (
    newPreferences: NotificationPreferencesEntity
  ): Promise<{ success: boolean; message: string }> => {
    setIsUpdating(true)
    setError(null)

    try {
      await jwtPermissionsApi.put('/api/notifications/pwa/preferences', newPreferences)
      setPreferences(newPreferences)
      
      return { success: true, message: 'Preferencias actualizadas exitosamente' }
      
    } catch (error) {
      console.error("Error updating notification preferences:", error)
      const message = 'Error al actualizar preferencias'
      setError(message)
      handleApiError(error, message)
      return { success: false, message }
    } finally {
      setIsUpdating(false)
    }
  }, [])

  // Update a single preference
  const updateSinglePreference = useCallback(async (
    key: keyof NotificationPreferencesEntity,
    value: boolean
  ): Promise<{ success: boolean; message: string }> => {
    if (!preferences) {
      return { success: false, message: 'Preferencias no cargadas' }
    }

    const updatedPreferences = { ...preferences, [key]: value }
    return updatePreferences(updatedPreferences)
  }, [preferences, updatePreferences])

  // Load preferences on mount
  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  return {
    // State
    preferences,
    isLoading,
    isUpdating,
    error,
    
    // Computed
    isReady: preferences !== null && !isLoading,
    
    // Actions
    updatePreferences,
    updateSinglePreference,
    refreshPreferences: loadPreferences,
    
    // Specific preference getters (with fallbacks)
    classReminders: preferences?.classReminders ?? true,
    paymentDue: preferences?.paymentDue ?? true,
    newClasses: preferences?.newClasses ?? true,
    promotions: preferences?.promotions ?? false,
    classCancellations: preferences?.classCancellations ?? true,
    generalAnnouncements: preferences?.generalAnnouncements ?? true,
  }
}