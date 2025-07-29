import { UserFormType } from "@/lib/types";
import { mockUsers } from "@/mocks/mockUsers";

// const BASE_URL = 'http://152.170.128.205:8080/api/user';
const BASE_URL = 'http://localhost:8080/api/user';


export async function fetchUsers() {
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
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function fetchUserDetail(id: number) {
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
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function createUser(user: UserFormType) {
  try {

    const response = await fetch(`${BASE_URL}/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
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
    console.error('Error creating user:', error);
    throw error;
  }
}



// MOCKS 



export async function fetchUserDetailMock(id: number) {

  const client = mockUsers.find((c) => c.id === id)

  if (!client) {
    return new Response(JSON.stringify({ error: "Cliente no encontrado" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify(client), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function fetchUsersMock(): Promise<Response> {

  return new Response(JSON.stringify(mockUsers), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}