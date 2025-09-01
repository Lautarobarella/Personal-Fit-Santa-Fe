"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  fetchAllSettings, 
  updateMonthlyFee, 
  updateRegistrationTime, 
  updateUnregistrationTime,
  updateMaxActivitiesPerDay
} from '@/api/settings/settingsApi'
import type { GlobalSettingsType } from '@/lib/types'
import { useAuth } from '@/contexts/auth-provider'

/**
 * Tipos para el estado del hook
 */
interface SettingsLoadingStates {
  isUpdatingMonthlyFee: boolean
  isUpdatingRegistrationTime: boolean
  isUpdatingUnregistrationTime: boolean
  isUpdatingMaxActivitiesPerDay: boolean
}

interface SettingsMutationResult {
  success: boolean
  message: string
}

/**
 * Custom Hook para manejar todo el estado y lógica de configuraciones
 * Centraliza toda la lógica de negocio y estado en un solo lugar
 */
export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<GlobalSettingsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingStates, setLoadingStates] = useState<SettingsLoadingStates>({
    isUpdatingMonthlyFee: false,
    isUpdatingRegistrationTime: false,
    isUpdatingUnregistrationTime: false,
    isUpdatingMaxActivitiesPerDay: false,
  })

  // ===============================
  // FUNCIONES DE CARGA DE DATOS
  // ===============================

  // Cargar configuraciones desde la base de datos
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const settingsData = await fetchAllSettings()
      setSettings(settingsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar configuraciones'
      setError(errorMessage)
      console.error('Error loading settings:', err)
      
      // Establecer valores por defecto si falla la carga
      setSettings({
        monthlyFee: 0,
        registrationTimeHours: 24,
        unregistrationTimeHours: 3,
        maxActivitiesPerDay: 1
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar configuraciones al montar el hook - solo si hay usuario autenticado
  useEffect(() => {
    // Pequeño delay para asegurar que el AuthProvider se haya inicializado completamente
    const timer = setTimeout(() => {
      if (user) {
        loadSettings()
      } else {
        // Si no hay usuario, establecer valores por defecto y parar el loading
        setSettings({
          monthlyFee: 0,
          registrationTimeHours: 24,
          unregistrationTimeHours: 3,
          maxActivitiesPerDay: 1
        })
        setLoading(false)
        setError(null)
      }
    }, 100) // 100ms delay
    
    return () => clearTimeout(timer)
  }, [loadSettings, user])

  // ===============================
  // FUNCIONES DE ACTUALIZACIÓN
  // ===============================

  // Actualizar cuota mensual
  const updateMonthlyFeeValue = useCallback(async (amount: number): Promise<SettingsMutationResult> => {
    try {
      setLoadingStates(prev => ({ ...prev, isUpdatingMonthlyFee: true }))
      setError(null)
      
      const updatedAmount = await updateMonthlyFee(amount)
      setSettings(prev => prev ? { ...prev, monthlyFee: updatedAmount } : null)
      
      return {
        success: true,
        message: 'Cuota mensual actualizada correctamente'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar cuota mensual'
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, isUpdatingMonthlyFee: false }))
    }
  }, [])

  // Actualizar tiempo de inscripción
  const updateRegistrationTimeValue = useCallback(async (hours: number): Promise<SettingsMutationResult> => {
    try {
      setLoadingStates(prev => ({ ...prev, isUpdatingRegistrationTime: true }))
      setError(null)
      
      const updatedHours = await updateRegistrationTime(hours)
      setSettings(prev => prev ? { ...prev, registrationTimeHours: updatedHours } : null)
      
      return {
        success: true,
        message: 'Tiempo de inscripción actualizado correctamente'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar tiempo de inscripción'
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, isUpdatingRegistrationTime: false }))
    }
  }, [])

  // Actualizar tiempo de desinscripción
  const updateUnregistrationTimeValue = useCallback(async (hours: number): Promise<SettingsMutationResult> => {
    try {
      setLoadingStates(prev => ({ ...prev, isUpdatingUnregistrationTime: true }))
      setError(null)
      
      const updatedHours = await updateUnregistrationTime(hours)
      setSettings(prev => prev ? { ...prev, unregistrationTimeHours: updatedHours } : null)
      
      return {
        success: true,
        message: 'Tiempo de desinscripción actualizado correctamente'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar tiempo de desinscripción'
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, isUpdatingUnregistrationTime: false }))
    }
  }, [])

  // Actualizar máximo de actividades por día
  const updateMaxActivitiesPerDayValue = useCallback(async (maxActivities: number): Promise<SettingsMutationResult> => {
    try {
      setLoadingStates(prev => ({ ...prev, isUpdatingMaxActivitiesPerDay: true }))
      setError(null)
      
      const updatedMaxActivities = await updateMaxActivitiesPerDay(maxActivities)
      setSettings(prev => prev ? { ...prev, maxActivitiesPerDay: updatedMaxActivities } : null)
      
      return {
        success: true,
        message: 'Máximo de actividades por día actualizado correctamente'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar máximo de actividades por día'
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, isUpdatingMaxActivitiesPerDay: false }))
    }
  }, [])

  // ===============================
  // FUNCIONES DE UTILIDAD
  // ===============================

  // Recargar configuraciones
  const reloadSettings = useCallback(async (): Promise<void> => {
    await loadSettings()
  }, [loadSettings])

  // Resetear errores
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // ===============================
  // GETTERS COMPUTADOS
  // ===============================

  // Valores individuales de configuración
  const monthlyFee = useMemo(() => settings?.monthlyFee ?? 0, [settings])
  const registrationTime = useMemo(() => settings?.registrationTimeHours ?? 24, [settings])
  const unregistrationTime = useMemo(() => settings?.unregistrationTimeHours ?? 3, [settings])
  const maxActivitiesPerDay = useMemo(() => settings?.maxActivitiesPerDay ?? 1, [settings])

  // Estado de carga consolidado
  const isLoading = useMemo(() => 
    loading || 
    loadingStates.isUpdatingMonthlyFee || 
    loadingStates.isUpdatingRegistrationTime || 
    loadingStates.isUpdatingUnregistrationTime ||
    loadingStates.isUpdatingMaxActivitiesPerDay, 
    [loading, loadingStates]
  )

  // ===============================
  // RETORNO DEL HOOK
  // ===============================

  return {
    // Data
    settings,
    monthlyFee,
    registrationTime,
    unregistrationTime,
    maxActivitiesPerDay,
    
    // Loading states
    loading,
    isLoading,
    error,
    ...loadingStates,
    
    // Actions
    updateMonthlyFeeValue,
    updateRegistrationTimeValue,
    updateUnregistrationTimeValue,
    updateMaxActivitiesPerDayValue,
    reloadSettings,
    clearError,
    
    // Utility functions
    loadSettings,
  }
}

export type SettingsState = ReturnType<typeof useSettings>