import { fetchArchivedMonthlyRevenues } from "@/api/payments/paymentsApi"
import { MonthlyRevenue } from "@/lib/types"
import { useQuery } from "@tanstack/react-query"

/**
 * Hook optimizado para manejo de ingresos mensuales archivados
 * El mes actual se calcula desde usePayment para evitar llamadas innecesarias
 */
export function useMonthlyRevenue(enabled: boolean = false) {
  // Solo historial de ingresos archivados - se fetchea bajo demanda
  const { data: archivedRevenues = [], isLoading: isLoadingArchived, error: archivedError } = useQuery<MonthlyRevenue[]>({
    queryKey: ["monthlyRevenue", "archived"],
    queryFn: fetchArchivedMonthlyRevenues,
    staleTime: 30 * 60 * 1000, // 30 minutos - el historial archivado no cambia frecuentemente
    gcTime: 60 * 60 * 1000, // 1 hora en caché para evitar refetch al volver a la página
    retry: 1,
    enabled, // Solo ejecutar si está habilitado (admin)
    refetchOnWindowFocus: false, // No refetch automático ya que es data histórica
  })

  return {
    // Datos
    archivedRevenues,
    
    // Estados de carga
    isLoadingArchived,
    isLoading: isLoadingArchived,
    
    // Errores
    archivedError,
    hasError: !!archivedError,
  }
}
