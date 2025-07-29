import { ActivityDetailInfo, ActivityFormType, ActivityType, Attendance } from "@/lib/types";
import { mockActivities, mockActivitiesDetails } from "@/mocks/mockActivities";

const BASE_URL = 'http://152.170.128.205:8080/api/activities';

export async function fetchActivities() {
  try {
    const response = await fetch(`${BASE_URL}/getAll`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) // por si no hay JSON
      const errorMessage = errorData.message || "Error desconocido"

      switch (response.status) {
        case 400:
          throw new Error(`Solicitud inválida: ${errorMessage}`)
        case 401:
          throw new Error(`No autorizado: ${errorMessage}`)
        case 402:
          throw new Error(`Pago requerido: ${errorMessage}`)
        case 403:
          throw new Error(`Prohibido: ${errorMessage}`)
        case 404:
          throw new Error(`Recurso no encontrado: ${errorMessage}`)
        case 409:
          throw new Error(`Conflicto: ${errorMessage}`)
        case 500:
          throw new Error(`Error interno del servidor: ${errorMessage}`)
        case 503:
          throw new Error(`Servicio no disponible: ${errorMessage}`)
        default:
          throw new Error(`Error ${response.status}: ${errorMessage}`)
      }
    }
    return await response.json();
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
    const response = await fetch(`${BASE_URL}/getAllByWeek/${formatTime(date)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) // por si no hay JSON
      const errorMessage = errorData.message || "Error desconocido"

      switch (response.status) {
        case 400:
          throw new Error(`Solicitud inválida: ${errorMessage}`)
        case 401:
          throw new Error(`No autorizado: ${errorMessage}`)
        case 402:
          throw new Error(`Pago requerido: ${errorMessage}`)
        case 403:
          throw new Error(`Prohibido: ${errorMessage}`)
        case 404:
          throw new Error(`Recurso no encontrado: ${errorMessage}`)
        case 409:
          throw new Error(`Conflicto: ${errorMessage}`)
        case 500:
          throw new Error(`Error interno del servidor: ${errorMessage}`)
        case 503:
          throw new Error(`Servicio no disponible: ${errorMessage}`)
        default:
          throw new Error(`Error ${response.status}: ${errorMessage}`)
      }
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Activities:', error);
    return [];
  }
}

export async function fetchActivityDetail(id: number) {
  try {
    const response = await fetch(`${BASE_URL}/info/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) // por si no hay JSON
      const errorMessage = errorData.message || "Error desconocido"

      switch (response.status) {
        case 400:
          throw new Error(`Solicitud inválida: ${errorMessage}`)
        case 401:
          throw new Error(`No autorizado: ${errorMessage}`)
        case 402:
          throw new Error(`Pago requerido: ${errorMessage}`)
        case 403:
          throw new Error(`Prohibido: ${errorMessage}`)
        case 404:
          throw new Error(`Recurso no encontrado: ${errorMessage}`)
        case 409:
          throw new Error(`Conflicto: ${errorMessage}`)
        case 500:
          throw new Error(`Error interno del servidor: ${errorMessage}`)
        case 503:
          throw new Error(`Servicio no disponible: ${errorMessage}`)
        default:
          throw new Error(`Error ${response.status}: ${errorMessage}`)
      }
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Activities:', error);
    throw error;
  }
}

export async function newActivity(activity: ActivityFormType) {

  try {
    const response = await fetch(`${BASE_URL}/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) // por si no hay JSON
      const errorMessage = errorData.message || "Error desconocido"

      switch (response.status) {
        case 400:
          throw new Error(`Solicitud inválida: ${errorMessage}`)
        case 401:
          throw new Error(`No autorizado: ${errorMessage}`)
        case 402:
          throw new Error(`Pago requerido: ${errorMessage}`)
        case 403:
          throw new Error(`Prohibido: ${errorMessage}`)
        case 404:
          throw new Error(`Recurso no encontrado: ${errorMessage}`)
        case 409:
          throw new Error(`Conflicto: ${errorMessage}`)
        case 500:
          throw new Error(`Error interno del servidor: ${errorMessage}`)
        case 503:
          throw new Error(`Servicio no disponible: ${errorMessage}`)
        default:
          throw new Error(`Error ${response.status}: ${errorMessage}`)
      }
    }
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
}

export async function editActivityBack(activity: ActivityFormType) {

  try {
    const response = await fetch(`${BASE_URL}/edit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) // por si no hay JSON
      const errorMessage = errorData.message || "Error desconocido"

      switch (response.status) {
        case 400:
          throw new Error(`Solicitud inválida: ${errorMessage}`)
        case 401:
          throw new Error(`No autorizado: ${errorMessage}`)
        case 402:
          throw new Error(`Pago requerido: ${errorMessage}`)
        case 403:
          throw new Error(`Prohibido: ${errorMessage}`)
        case 404:
          throw new Error(`Recurso no encontrado: ${errorMessage}`)
        case 409:
          throw new Error(`Conflicto: ${errorMessage}`)
        case 500:
          throw new Error(`Error interno del servidor: ${errorMessage}`)
        case 503:
          throw new Error(`Servicio no disponible: ${errorMessage}`)
        default:
          throw new Error(`Error ${response.status}: ${errorMessage}`)
      }
    }
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
}

export async function enrollActivity(attendance: Attendance) {
  try {
    const response = await fetch(`${BASE_URL}/enroll/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attendance),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) // por si no hay JSON
      const errorMessage = errorData.message || "Error desconocido"

      switch (response.status) {
        case 400:
          throw new Error(`Solicitud inválida: ${errorMessage}`)
        case 401:
          throw new Error(`No autorizado: ${errorMessage}`)
        case 402:
          throw new Error(`Pago requerido: ${errorMessage}`)
        case 403:
          throw new Error(`Prohibido: ${errorMessage}`)
        case 404:
          throw new Error(`Recurso no encontrado: ${errorMessage}`)
        case 409:
          throw new Error(`Conflicto: ${errorMessage}`)
        case 500:
          throw new Error(`Error interno del servidor: ${errorMessage}`)
        case 503:
          throw new Error(`Servicio no disponible: ${errorMessage}`)
        default:
          throw new Error(`Error ${response.status}: ${errorMessage}`)
      }
    }
    return await response.json();
  } catch (error) {
    console.error('Error enrolling in activity:', error);
    throw error;
  }
}

export async function unenrollActivity(attendance: Attendance) {
  try {
    const response = await fetch(`${BASE_URL}/enroll`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attendance),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) // por si no hay JSON
      const errorMessage = errorData.message || "Error desconocido"

      switch (response.status) {
        case 400:
          throw new Error(`Solicitud inválida: ${errorMessage}`)
        case 401:
          throw new Error(`No autorizado: ${errorMessage}`)
        case 402:
          throw new Error(`Pago requerido: ${errorMessage}`)
        case 403:
          throw new Error(`Prohibido: ${errorMessage}`)
        case 404:
          throw new Error(`Recurso no encontrado: ${errorMessage}`)
        case 409:
          throw new Error(`Conflicto: ${errorMessage}`)
        case 500:
          throw new Error(`Error interno del servidor: ${errorMessage}`)
        case 503:
          throw new Error(`Servicio no disponible: ${errorMessage}`)
        default:
          throw new Error(`Error ${response.status}: ${errorMessage}`)
      }
    }
    return await response.json();
  } catch (error) {
    console.error('Error enrolling in activity:', error);
    throw error;
  }
}

export async function fetchTrainers() {
  try {
    const response = await fetch('http://152.170.128.205:8080/api/user/trainers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) // por si no hay JSON
      const errorMessage = errorData.message || "Error desconocido"

      switch (response.status) {
        case 400:
          throw new Error(`Solicitud inválida: ${errorMessage}`)
        case 401:
          throw new Error(`No autorizado: ${errorMessage}`)
        case 402:
          throw new Error(`Pago requerido: ${errorMessage}`)
        case 403:
          throw new Error(`Prohibido: ${errorMessage}`)
        case 404:
          throw new Error(`Recurso no encontrado: ${errorMessage}`)
        case 409:
          throw new Error(`Conflicto: ${errorMessage}`)
        case 500:
          throw new Error(`Error interno del servidor: ${errorMessage}`)
        case 503:
          throw new Error(`Servicio no disponible: ${errorMessage}`)
        default:
          throw new Error(`Error ${response.status}: ${errorMessage}`)
      }
    }
    return await response.json();
  } catch (error) {
    console.error('Error enrolling in activity:', error);
    throw error;
  }
}


// MOCKS


export async function fetchActivitiesMock(): Promise<Response> {
  const activities = mockActivities
  const response = new Response(JSON.stringify(activities), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return await response.json()
}


export async function fetchActivitiesByDateMock(date: Date): Promise<ActivityType[]> {
  try {
    // Calcular lunes de la semana
    const monday = new Date(date)
    monday.setHours(0, 0, 0, 0)
    const day = monday.getDay()
    const diff = (day === 0 ? -6 : 1) - day // Ajuste para que lunes sea el primer día
    monday.setDate(monday.getDate() + diff)

    // Calcular domingo
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    // Filtrar mockActivities que estén dentro de ese rango
    const weekActivities = mockActivities.filter((activity) => {
      const activityDate = new Date(activity.date)
      return activityDate >= monday && activityDate <= sunday
    })
    return weekActivities
  } catch (error) {
    console.error("Error mockeando actividades:", error)
    return []
  }
}

export async function fetchActivityDetailMock(id: number): Promise<ActivityDetailInfo> {
  const activities = mockActivitiesDetails.find(a => a.id === id)
  const response = new Response(JSON.stringify(activities), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return await response.json()
}