import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { handleApiError, handleValidationError, isValidationError } from "@/lib/error-handler";
import { Attendance, AttendanceStatus } from "@/lib/types";

/**
 * Obtiene todas las asistencias de una actividad específica
 */
export async function fetchActivityAttendances(activityId: number): Promise<Attendance[]> {
  try {
    const response = await jwtPermissionsApi.get(`/api/attendance/activity/${activityId}`);
    return response;
  } catch (error) {
    handleApiError(error, 'Error al cargar las asistencias de la actividad');
    return [];
  }
}

/**
 * Obtiene todas las asistencias de una actividad específica con información de usuario
 */
export async function fetchActivityAttendancesWithUserInfo(activityId: number): Promise<Attendance[]> {
  try {
    const response = await jwtPermissionsApi.get(`/api/attendance/activity/${activityId}/with-user-info`);
    return response;
  } catch (error) {
    handleApiError(error, 'Error al cargar las asistencias de la actividad con información de usuario');
    return [];
  }
}

/**
 * Obtiene todas las asistencias de un usuario específico
 */
export async function fetchUserAttendances(userId: number): Promise<Attendance[]> {
  try {
    const response = await jwtPermissionsApi.get(`/api/attendance/user/${userId}`);
    return response;
  } catch (error) {
    handleApiError(error, 'Error al cargar las asistencias del usuario');
    return [];
  }
}

/**
 * Actualiza el estado de una asistencia específica
 */
export async function updateAttendanceStatus(attendanceId: number, status: AttendanceStatus) {
  try {
    const response = await jwtPermissionsApi.put(`/api/attendance/${attendanceId}/status`, {
      status: status.toString()
    });
    return response;
  } catch (error) {
    if (isValidationError(error)) {
      handleValidationError(error);
    } else {
      handleApiError(error, 'Error al actualizar el estado de asistencia');
    }
    throw error;
  }
}

/**
 * Inscribe un usuario en una actividad
 */
export async function enrollUserInActivity(userId: number, activityId: number): Promise<Attendance> {
  try {
    const response = await jwtPermissionsApi.post(`/api/attendance/enroll/${userId}/${activityId}`, {});
    return response;
  } catch (error) {
    if (isValidationError(error)) {
      handleValidationError(error);
    } else {
      handleApiError(error, 'Error al inscribir usuario en la actividad');
    }
    throw error;
  }
}

/**
 * Desinscribe un usuario de una actividad
 */
export async function unenrollUserFromActivity(userId: number, activityId: number) {
  try {
    const response = await jwtPermissionsApi.delete(`/api/attendance/unenroll/${userId}/${activityId}`);
    return response;
  } catch (error) {
    handleApiError(error, 'Error al desinscribir usuario de la actividad');
    throw error;
  }
}

/**
 * Verifica si un usuario está inscrito en una actividad
 */
export async function checkUserEnrollment(activityId: number, userId: number): Promise<boolean> {
  try {
    const response = await jwtPermissionsApi.get(`/api/attendance/${activityId}/enrolled/${userId}`);
    return response;
  } catch (error) {
    handleApiError(error, 'Error al verificar inscripción del usuario');
    return false;
  }
}
