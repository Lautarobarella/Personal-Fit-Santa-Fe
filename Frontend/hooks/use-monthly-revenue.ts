import { fetchArchivedMonthlyRevenues, fetchCurrentMonthRevenue } from "@/api/payments/paymentsApi"
import { MonthlyRevenue } from "@/lib/types"
import { useQuery } from "@tanstack/react-query"

/**
 * Hook para manejo de ingresos mensuales (solo para administradores)
 */
export function useMonthlyRevenue(enabled: boolean = false) {
  // Ingresos del mes actual
  const { data: currentMonthRevenue, isLoading: isLoadingCurrent, error: currentError } = useQuery<MonthlyRevenue>({
    queryKey: ["monthlyRevenue", "current"],
    queryFn: fetchCurrentMonthRevenue,
    staleTime: 1 * 60 * 1000, // Reducido a 1 minuto para actualizaciones más frecuentes
    retry: 1,
    enabled, // Solo ejecutar si está habilitado (admin)
    refetchOnWindowFocus: true, // Refrescar cuando la ventana toma foco
  })

  // Historial de ingresos archivados
  const { data: archivedRevenues = [], isLoading: isLoadingArchived, error: archivedError } = useQuery<MonthlyRevenue[]>({
    queryKey: ["monthlyRevenue", "archived"],
    queryFn: fetchArchivedMonthlyRevenues,
    staleTime: 10 * 60 * 1000, // 10 minutos (historial cambia menos frecuentemente)
    retry: 1,
    enabled, // Solo ejecutar si está habilitado (admin)
  })

  return {
    // Datos
    currentMonthRevenue,
    archivedRevenues,
    
    // Estados de carga
    isLoadingCurrent,
    isLoadingArchived,
    isLoading: isLoadingCurrent || isLoadingArchived,
    
    // Errores
    currentError,
    archivedError,
    hasError: !!currentError || !!archivedError,
  }
}
