"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  fetchAllSettings, 
  updateMonthlyFee, 
  updateRegistrationTime, 
  updateUnregistrationTime 
} from '@/api/settings/settingsApi'
import type { GlobalSettingsType } from '@/lib/types'

/**
 * Tipos para el estado del hook
 */
interface SettingsLoadingStates {
  isUpdatingMonthlyFee: boolean
  isUpdatingRegistrationTime: boolean
  isUpdatingUnregistrationTime: boolean
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
  const [settings, setSettings] = useState<GlobalSettingsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingStates, setLoadingStates] = useState<SettingsLoadingStates>({
    isUpdatingMonthlyFee: false,
    isUpdatingRegistrationTime: false,
    isUpdatingUnregistrationTime: false,
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
        unregistrationTimeHours: 3
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar configuraciones al montar el hook
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

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

  // Estado de carga consolidado
  const isLoading = useMemo(() => 
    loading || 
    loadingStates.isUpdatingMonthlyFee || 
    loadingStates.isUpdatingRegistrationTime || 
    loadingStates.isUpdatingUnregistrationTime, 
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
    
    // Loading states
    loading,
    isLoading,
    error,
    ...loadingStates,
    
    // Actions
    updateMonthlyFeeValue,
    updateRegistrationTimeValue,
    updateUnregistrationTimeValue,
    reloadSettings,
    clearError,
    
    // Utility functions
    loadSettings,
  }
}

export type SettingsState = ReturnType<typeof useSettings>