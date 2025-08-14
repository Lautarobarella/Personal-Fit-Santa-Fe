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
