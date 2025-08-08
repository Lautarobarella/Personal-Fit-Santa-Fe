import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { UserFormType } from "@/lib/types";
import { handleApiError, isValidationError, handleValidationError } from "@/lib/error-handler";

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

export async function updateUser(id: number, user: UserFormType) {
  try {
    return await jwtPermissionsApi.put(`/api/users/${id}`, user);
  } catch (error) {
    if (isValidationError(error)) {
      handleValidationError(error);
    } else {
      handleApiError(error, 'Error al actualizar el usuario');
    }
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
