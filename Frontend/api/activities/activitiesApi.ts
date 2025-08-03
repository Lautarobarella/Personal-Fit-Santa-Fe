import { apiClient } from "@/lib/api";
import { ActivityFormType, Attendance, EnrollmentRequest } from "@/lib/types";

export async function fetchActivities() {
  try {
    return await apiClient.get('/api/activities/getAll');
  } catch (error) {
    console.error('Error fetching Activities:', error);
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
    return await apiClient.get(`/api/activities/getAllByWeek/${formatTime(date)}`);
  } catch (error) {
    console.error('Error fetching Activities:', error);
    return [];
  }
}

export async function fetchActivityDetail(id: number) {
  try {
    return await apiClient.get(`/api/activities/info/${id}`);
  } catch (error) {
    console.error('Error fetching Activity Detail:', error);
    throw error;
  }
}

export async function newActivity(activity: ActivityFormType) {
  try {
    return await apiClient.post('/api/activities/create', activity);
  } catch (error) {
    console.error('Error creating Activity:', error);
    throw error;
  }
}

export async function editActivityBack(activity: ActivityFormType) {
  try {
    return await apiClient.put(`/api/activities/${activity.id}`, activity);
  } catch (error) {
    console.error('Error editing Activity:', error);
    throw error;
  }
}

export async function deleteActivity(id: number) {
  try {
    return await apiClient.delete(`/api/activities/${id}`);
  } catch (error) {
    console.error('Error deleting Activity:', error);
    throw error;
  }
}

export async function enrollActivity(enrollmentRequest: EnrollmentRequest) {
  try {
    return await apiClient.post('/api/activities/enroll', enrollmentRequest);
  } catch (error) {
    console.error('Error enrolling in Activity:', error);
    throw error;
  }
}

export async function unenrollActivity(enrollmentRequest: EnrollmentRequest) {
  try {
    return await apiClient.post('/api/activities/unenroll', enrollmentRequest);
  } catch (error) {
    console.error('Error unenrolling from Activity:', error);
    throw error;
  }
}

export async function isUserEnrolled(activityId: number, userId: number) {
  try {
    return await apiClient.get(`/api/activities/${activityId}/enrolled/${userId}`);
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return false;
  }
}

export async function fetchTrainers() {
  try {
    return await apiClient.get('/api/users/trainers');
  } catch (error) {
    console.error('Error fetching Trainers:', error);
    return [];
  }
}
