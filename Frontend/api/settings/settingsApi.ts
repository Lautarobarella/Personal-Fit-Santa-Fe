import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { handleApiError } from "@/lib/error-handler";

/**
 * Obtiene la cuota mensual configurada
 * @returns Promise<number> Precio de la cuota mensual
 */
export async function fetchMonthlyFee(): Promise<number> {
  try {
    const fee = await jwtPermissionsApi.get('/settings/api/monthly-fee');
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
    return await jwtPermissionsApi.post('/settings/api/monthly-fee', { amount });
  } catch (error) {
    handleApiError(error, 'Error al actualizar la cuota mensual');
    throw error;
  }
}

/**
 * Obtiene el tiempo de inscripción configurado
 * @returns Promise<number> Tiempo en horas
 */
export async function fetchRegistrationTime(): Promise<number> {
  try {
    const hours = await jwtPermissionsApi.get('/settings/api/registration-time');
    return hours;
  } catch (error) {
    handleApiError(error, 'Error al obtener el tiempo de inscripción');
    throw error;
  }
}

/**
 * Actualiza el tiempo de inscripción
 * @param hours - Tiempo en horas
 * @returns Promise<number> Tiempo actualizado en horas
 */
export async function updateRegistrationTime(hours: number): Promise<number> {
  try {
    return await jwtPermissionsApi.post('/settings/api/registration-time', { hours });
  } catch (error) {
    handleApiError(error, 'Error al actualizar el tiempo de inscripción');
    throw error;
  }
}

/**
 * Obtiene el tiempo de desinscripción configurado
 * @returns Promise<number> Tiempo en horas
 */
export async function fetchUnregistrationTime(): Promise<number> {
  try {
    const hours = await jwtPermissionsApi.get('/settings/api/unregistration-time');
    return hours;
  } catch (error) {
    handleApiError(error, 'Error al obtener el tiempo de desinscripción');
    throw error;
  }
}

/**
 * Actualiza el tiempo de desinscripción
 * @param hours - Tiempo en horas
 * @returns Promise<number> Tiempo actualizado en horas
 */
export async function updateUnregistrationTime(hours: number): Promise<number> {
  try {
    return await jwtPermissionsApi.post('/settings/api/unregistration-time', { hours });
  } catch (error) {
    handleApiError(error, 'Error al actualizar el tiempo de desinscripción');
    throw error;
  }
}