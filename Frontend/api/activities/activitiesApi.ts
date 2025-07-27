import { ActivityDetailInfo, ActivityFormType, ActivityType } from "@/lib/types";

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
      throw new Error(`Error al obtener los clientes: ${response.status}`);
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
      throw new Error(`Error al obtener los clientes: ${response.status}`);
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
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching Activities:', error);
    throw error;
  }
}

export async function newActivity(activity: ActivityFormType) {
  console.log("Creating user:", activity);
  try {
    const response = await fetch(`${BASE_URL}/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity),
    });

    if (!response.ok) {
      throw new Error(`Error al crear la actividad: ${response.status}`);
    }
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
}

export async function enrollActivity(activityId: number) {
  try {
    const response = await fetch(`${BASE_URL}/enroll/${activityId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al inscribirse en la actividad: ${response.status}`);
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
      throw new Error(`En la busqueda de los entrenadores: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error enrolling in activity:', error);
    throw error;
  }
}