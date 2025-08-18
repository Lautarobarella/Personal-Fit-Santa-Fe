import { useActivity } from '@/components/providers/activity-provider'

/**
 * Hook simplificado que usa el ActivityProvider
 * Mantiene compatibilidad con el código existente
 */
export function useActivities() {
  return useActivity()
}

// Re-exportar para mantener compatibilidad
export { useActivity } from '@/components/providers/activity-provider'
