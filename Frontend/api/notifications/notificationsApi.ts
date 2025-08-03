import { jwtPermissionsApi } from "@/lib/api";
import { handleApiError } from "@/lib/error-handler";

export async function fetchNotifications() {
    try {
        return await jwtPermissionsApi.get('/api/notifications/getAll');
    } catch (error) {
        handleApiError(error, 'Error al cargar las notificaciones');
        return [];
    }
}

