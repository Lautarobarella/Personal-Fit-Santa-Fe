import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { handleApiError } from "@/lib/error-handler";
import { UserStatus } from "@/lib/types";

export interface ClientStats {
  weeklyActivityCount: number;
  nextClass: {
    id: number;
    name: string;
    date: Date;
    time: string;
  } | null;
  completedClassesCount: number;
  membershipStatus: UserStatus;
  remainingDays: number;
}

/**
 * Obtiene las estadísticas del dashboard para un cliente específico
 * @param clientId - ID del cliente
 * @returns Promise<ClientStats> Estadísticas del cliente
 */
export async function fetchClientStats(clientId: number): Promise<ClientStats> {
  try {
    return await jwtPermissionsApi.get(`/api/users/stats/${clientId}`);
  } catch (error) {
    handleApiError(error, 'Error al cargar las estadísticas del cliente');
    // Retornar datos por defecto en caso de error
    return {
      weeklyActivityCount: 0,
      nextClass: null,
      completedClassesCount: 0,
      membershipStatus: UserStatus.INACTIVE,
      remainingDays: 0
    };
  }
}

/**
 * Obtiene las actividades de la semana actual para un cliente
 * @param clientId - ID del cliente
 * @returns Promise<number> Cantidad de actividades de la semana
 */
export async function fetchWeeklyActivities(clientId: number): Promise<number> {
  try {
    const today = new Date();
    const monday = new Date(today);
    const diffToMonday = (monday.getDay() + 6) % 7; // 0=domingo, 1=lunes, etc.
    monday.setDate(monday.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    
    const formatDate = (date: Date) => {
      return date.toISOString().slice(0, 10); // YYYY-MM-DD
    };
    
    return await jwtPermissionsApi.get(`/api/users/${clientId}/weekly-activities/${formatDate(monday)}`);
  } catch (error) {
    handleApiError(error, 'Error al cargar las actividades semanales');
    return 0;
  }
}

/**
 * Obtiene la próxima clase más cercana para un cliente
 * @param clientId - ID del cliente
 * @returns Promise<ClientStats['nextClass']> Próxima clase o null
 */
export async function fetchNextClass(clientId: number): Promise<ClientStats['nextClass']> {
  try {
    return await jwtPermissionsApi.get(`/api/users/${clientId}/next-class`);
  } catch (error) {
    handleApiError(error, 'Error al cargar la próxima clase');
    return null;
  }
}

/**
 * Obtiene el total de clases completadas por un cliente
 * @param clientId - ID del cliente
 * @returns Promise<number> Total de clases completadas
 */
export async function fetchCompletedClasses(clientId: number): Promise<number> {
  try {
    return await jwtPermissionsApi.get(`/api/users/${clientId}/completed-classes`);
  } catch (error) {
    handleApiError(error, 'Error al cargar las clases completadas');
    return 0;
  }
}

/**
 * Obtiene el estado de membresía de un cliente
 * @param clientId - ID del cliente
 * @returns Promise<UserStatus> Estado de membresía
 */
export async function fetchMembershipStatus(clientId: number): Promise<UserStatus> {
  try {
    const result = await jwtPermissionsApi.get(`/api/users/${clientId}/membership-status`);
    return result.status || UserStatus.INACTIVE;
  } catch (error) {
    handleApiError(error, 'Error al cargar el estado de membresía');
    return UserStatus.INACTIVE;
  }
}
