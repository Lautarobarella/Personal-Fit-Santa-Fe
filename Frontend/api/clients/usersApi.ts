import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { handleApiError, handleValidationError, isValidationError } from "@/lib/error-handler";
import { UserFormType } from "@/lib/types";

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
