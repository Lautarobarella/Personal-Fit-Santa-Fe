import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { handleApiError } from "@/lib/error-handler";
import type { GlobalSettingsType } from "@/lib/types";

/**
 * Obtiene todas las configuraciones globales en una sola llamada
 * @returns Promise<GlobalSettingsType> Todas las configuraciones
 */
export async function fetchAllSettings(): Promise<GlobalSettingsType> {
  try {
    // Intentar obtener todas las configuraciones desde un endpoint unificado
    // Si no existe, hacer llamadas individuales
    try {
      const allSettings = await jwtPermissionsApi.get('/api/settings/all');
      return allSettings;
    } catch (unifiedError) {
      // Fallback: obtener configuraciones individualmente
      const [monthlyFee, registrationTimeHours, unregistrationTimeHours, maxActivitiesPerDay] = await Promise.all([
        fetchMonthlyFee(),
        fetchRegistrationTime(),
        fetchUnregistrationTime(),
        fetchMaxActivitiesPerDay()
      ]);
      
      return {
        monthlyFee,
        registrationTimeHours,
        unregistrationTimeHours,
        maxActivitiesPerDay
      };
    }
  } catch (error) {
    handleApiError(error, 'Error al obtener las configuraciones');
    throw error;
  }
}

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

/**
 * Obtiene el tiempo de inscripción configurado
 * @returns Promise<number> Tiempo en horas
 */
export async function fetchRegistrationTime(): Promise<number> {
  try {
    const hours = await jwtPermissionsApi.get('/api/settings/registration-time');
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
    return await jwtPermissionsApi.post('/api/settings/registration-time', { hours });
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
    const hours = await jwtPermissionsApi.get('/api/settings/unregistration-time');
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
    return await jwtPermissionsApi.post('/api/settings/unregistration-time', { hours });
  } catch (error) {
    handleApiError(error, 'Error al actualizar el tiempo de desinscripción');
    throw error;
  }
}

/**
 * Obtiene el máximo de actividades por día configurado
 * @returns Promise<number> Máximo de actividades por día
 */
export async function fetchMaxActivitiesPerDay(): Promise<number> {
  try {
    const maxActivities = await jwtPermissionsApi.get('/api/settings/max-activities-per-day');
    return maxActivities;
  } catch (error) {
    handleApiError(error, 'Error al obtener el máximo de actividades por día');
    throw error;
  }
}

/**
 * Actualiza el máximo de actividades por día
 * @param maxActivities - Máximo número de actividades
 * @returns Promise<number> Máximo actualizado de actividades por día
 */
export async function updateMaxActivitiesPerDay(maxActivities: number): Promise<number> {
  try {
    return await jwtPermissionsApi.post('/api/settings/max-activities-per-day', { hours: maxActivities });
  } catch (error) {
    handleApiError(error, 'Error al actualizar el máximo de actividades por día');
    throw error;
  }
}