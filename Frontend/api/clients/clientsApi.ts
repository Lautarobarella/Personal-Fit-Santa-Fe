import { UserFormType } from "@/lib/types";
import { mockUsers } from "@/mocks/mockUsers";

const BASE_URL = 'http://152.170.128.205:8080/api/user';

export async function fetchUsers() {
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
      throw new Error(`Error: ${response.status}`);
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
      throw new Error(`Error al crear el cliente: ${response.status}`);
    }
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function fetchUsersMock(): Promise<Response> {

    return new Response(JSON.stringify(mockUsers), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}