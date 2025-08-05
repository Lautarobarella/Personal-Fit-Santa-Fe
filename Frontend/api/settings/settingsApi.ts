import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { handleApiError } from "@/lib/error-handler";

/**
 * Obtiene la cuota mensual configurada
 * @returns Promise<number> Precio de la cuota mensual
 */
export async function fetchMonthlyFee(): Promise<number> {
  try {
    const fee = await jwtPermissionsApi.get('/api/settings/monthly-fee');
    return fee;
  } catch (error) {
    handleApiError(error, 'Error al obtener la cuota mensual');
    throw error;
  }
}

/**
 * Actualiza la cuota mensual
 * @param amount - Nuevo monto de la cuota mensual
 * @returns Promise<number> Precio actualizado de la cuota mensual
 */
export async function updateMonthlyFee(amount: number): Promise<number> {
  try {
    return await jwtPermissionsApi.post('/api/settings/monthly-fee', { amount });
  } catch (error) {
    handleApiError(error, 'Error al actualizar la cuota mensual');
    throw error;
  }
} 