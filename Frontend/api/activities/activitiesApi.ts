import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { handleApiError, handleValidationError, isValidationError } from "@/lib/error-handler";
import { ActivityFormType, EnrollmentRequest } from "@/lib/types";

export async function fetchActivities() {
  try {
    return await jwtPermissionsApi.get('/api/activities/getAll');
  } catch (error) {
    handleApiError(error, 'Error al cargar las actividades');
    return [];
  }
}

export async function fetchActivitiesByDate(date: Date) {
  try {
    const formatTime = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0')
      const year = date.getFullYear()
      const month = pad(date.getMonth() + 1) // Meses van de 0 a 11
      const day = pad(date.getDate())
      return `${year}-${month}-${day}`
    }
    return await jwtPermissionsApi.get(`/api/activities/getAllByWeek/${formatTime(date)}`);
  } catch (error) {
    handleApiError(error, 'Error al cargar las actividades por fecha');
    return [];
  }
}

export async function fetchActivityDetail(id: number) {
  try {
    const response = await jwtPermissionsApi.get(`/api/activities/${id}`);
    return response;
  } catch (error) {
    console.error("Error in fetchActivityDetail:", error);
    handleApiError(error, 'Error al cargar los detalles de la actividad');
    throw error;
  }
}

export async function newActivity(activity: ActivityFormType) {
  try {
    return await jwtPermissionsApi.post('/api/activities/new', activity);
  } catch (error) {
    if (isValidationError(error)) {
      handleValidationError(error);
    } else {
      handleApiError(error, 'Error al crear la actividad');
    }
    throw error;
  }
}

export async function editActivityBack(activity: ActivityFormType) {
  try {
    // Transformar los datos para que coincidan con el formato esperado por el backend
    const transformedActivity = {
      ...activity,
      date: activity.date, // El backend espera LocalDate
      time: activity.time, // El backend espera LocalTime
    };
    
    return await jwtPermissionsApi.put(`/api/activities/${activity.id}`, transformedActivity);
  } catch (error) {
    if (isValidationError(error)) {
      handleValidationError(error);
    } else {
      handleApiError(error, 'Error al editar la actividad');
    }
    throw error;
  }
}

export async function deleteActivity(id: number) {
  try {
    return await jwtPermissionsApi.delete(`/api/activities/${id}`);
  } catch (error) {
    handleApiError(error, 'Error al eliminar la actividad');
    throw error;
  }
}

export async function enrollActivity(enrollmentRequest: EnrollmentRequest) {
  try {
    return await jwtPermissionsApi.post('/api/activities/enroll', enrollmentRequest);
  } catch (error) {
    handleApiError(error, 'Error al inscribirse en la actividad');
    throw error;
  }
}

export async function unenrollActivity(enrollmentRequest: EnrollmentRequest) {
  try {
    return await jwtPermissionsApi.post('/api/activities/unenroll', enrollmentRequest);
  } catch (error) {
    handleApiError(error, 'Error al cancelar la inscripción');
    throw error;
  }
}

export async function isUserEnrolled(activityId: number, userId: number) {
  try {
    return await jwtPermissionsApi.get(`/api/activities/${activityId}/enrolled/${userId}`);
  } catch (error) {
    handleApiError(error, 'Error al verificar la inscripción');
    return false;
  }
}

export async function fetchTrainers() {
  try {
    return await jwtPermissionsApi.get('/api/users/trainers');
  } catch (error) {
    handleApiError(error, 'Error al cargar los entrenadores');
    return [];
  }
}
