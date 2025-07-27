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

export async function newActivity(user: ActivityFormType) {
  try {
    const response = await fetch(`${BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      throw new Error(`Error al crear el cliente: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating user:', error);
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