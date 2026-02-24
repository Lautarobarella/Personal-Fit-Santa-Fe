import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { handleApiError, handleValidationError, isValidationError } from "@/lib/error-handler";
import { TrainerDashboardStats, UserFormType, WorkShift } from "@/lib/types";

export async function fetchUsers() {
  try {
    return await jwtPermissionsApi.get('/api/users/getAll');
  } catch (error) {
    handleApiError(error, 'Error al cargar los usuarios');
    return [];
  }
}

export async function fetchUserDetail(id: number) {
  try {
    return await jwtPermissionsApi.get(`/api/users/info/${id}`);
  } catch (error) {
    handleApiError(error, 'Error al cargar los detalles del usuario');
    throw error;
  }
}

/**
 * Busca un usuario por DNI para validación en pagos
 * @param dni DNI del usuario a buscar
 * @returns Promise<{id: number, name: string, dni: number, status: string}> datos básicos del usuario
 */
export async function fetchUserByDni(dni: number) {
  try {
    const response = await jwtPermissionsApi.get(`/api/users/by-dni/${dni}`);
    return {
      id: response.id,
      name: response.firstName + ' ' + response.lastName,
      dni: response.dni,
      status: response.status
    };
  } catch (error) {
    // No mostrar toasts aquí para la validación, solo lanzar el error
    throw error;
  }
}

/**
 * Obtiene los datos del usuario actual usando su ID
 * @param userId ID del usuario
 * @returns Promise<UserType> los datos del usuario
 */
export async function fetchCurrentUserById(userId: number) {
  try {
    return await jwtPermissionsApi.get(`/api/users/info/${userId}`);
  } catch (error) {
    // No mostrar toasts aquí, dejar que el contexto maneje el error
    throw error;
  }
}

export async function deleteUser(id: number) {
  try {
    return await jwtPermissionsApi.delete(`/api/users/delete/${id}`);
  } catch (error) {
    handleApiError(error, 'Error al eliminar el usuario');
    throw error;
  }
}

export async function createUser(user: UserFormType) {
  try {
    return await jwtPermissionsApi.post('/api/users/new', user);
  } catch (error) {
    if (isValidationError(error)) {
      handleValidationError(error);
    } else {
      handleApiError(error, 'Error al crear el usuario');
    }
    throw error;
  }
}

export async function updateUserPassword(data: {
  userId: number;
  currentPassword: string;
  newPassword: string;
}) {
  try {
    return await jwtPermissionsApi.put('/api/users/update-password', data);
  } catch (error) {
    // No mostrar toasts aquí, dejar que el componente maneje el error
    throw error;
  }
}

export async function updateUserProfile(data: {
  userId: number;
  address?: string;
  phone?: string;
  emergencyPhone?: string;
}) {
  try {
    return await jwtPermissionsApi.put('/api/users/update-profile', data);
  } catch (error) {
    // No mostrar toasts aquí, dejar que el componente maneje el error
    throw error;
  }
}

/**
 * Verifica si un usuario tiene membresía activa
 * @param userId ID del usuario
 * @returns Promise<boolean> true si la membresía está activa
 */
export async function checkUserMembershipStatus(userId: number): Promise<boolean> {
  try {
    const response = await jwtPermissionsApi.get(`/api/users/${userId}/membership-status`);
    return response.status === "ACTIVE";
  } catch (error) {
    console.error("Error checking membership status:", error);
    return false;
  }
}

// ─── Trainer / Work-Shift API ───────────────────────────────────────────────

export async function fetchCurrentShift(trainerId: number): Promise<WorkShift | null> {
  try {
    const response = await jwtPermissionsApi.get(`/api/work-shifts/current/${trainerId}`);
    if (!response || typeof response !== 'object') return null;
    // Validate essential fields to avoid rendering objects in React
    return {
      id: Number(response.id) || 0,
      startTime: typeof response.startTime === 'string' ? response.startTime : '',
      endTime: typeof response.endTime === 'string' ? response.endTime : null,
      totalHours: response.totalHours != null ? Number(response.totalHours) : null,
      status: typeof response.status === 'string' ? response.status as WorkShift['status'] : 'ACTIVE',
    };
  } catch (error) {
    handleApiError(error, 'Error al obtener el turno actual');
    return null;
  }
}

export async function fetchShiftHistory(trainerId: number): Promise<WorkShift[]> {
  try {
    const response = await jwtPermissionsApi.get(`/api/work-shifts/history/${trainerId}`);
    if (!Array.isArray(response)) return [];
    // Validate each shift to avoid rendering objects in React
    return response.map((s: any) => ({
      id: Number(s.id) || 0,
      startTime: typeof s.startTime === 'string' ? s.startTime : '',
      endTime: typeof s.endTime === 'string' ? s.endTime : null,
      totalHours: s.totalHours != null ? Number(s.totalHours) : null,
      status: typeof s.status === 'string' ? s.status as WorkShift['status'] : 'COMPLETED',
    }));
  } catch (error) {
    handleApiError(error, 'Error al obtener el historial de turnos');
    return [];
  }
}

export async function fetchTrainerDashboardStats(trainerId: number): Promise<TrainerDashboardStats | null> {
  try {
    const data = await jwtPermissionsApi.get(`/api/trainer/${trainerId}/dashboard-stats`);
    if (!data) return null;
    return {
      classesToday: Number(data.classesToday) || 0,
      nextClassName: typeof data.nextClassName === 'string' ? data.nextClassName : null,
      nextClassTime: typeof data.nextClassTime === 'string' ? data.nextClassTime : null,
      currentShiftHours: Number(data.currentShiftHours) || 0,
      weeklyHours: Number(data.weeklyHours) || 0,
    };
  } catch (error) {
    handleApiError(error, 'Error al obtener estadísticas del entrenador');
    return null;
  }
}

export async function toggleTrainerShift(dni: number): Promise<{ success: boolean; status?: string; message?: string }> {
  try {
    const data = await jwtPermissionsApi.post(
      '/api/attendance/nfc/9551674a19bae81d4d27f5436470c9ee6ecd0b371088686f6afc58d6bf68df30',
      { dni }
    );
    if (!data || typeof data !== 'object') return { success: false, message: 'Sin respuesta del servidor' };
    return {
      success: !!data.success,
      status: typeof data.status === 'string' ? data.status : undefined,
      message: typeof data.message === 'string' ? data.message : undefined,
    };
  } catch (error) {
    console.error('Error toggling shift:', error);
    return { success: false, message: 'No se pudo conectar con el servidor' };
  }
}
