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

// MOCK DE FETCH USER USADO PARA REQUERIMIENTO SUBIR COMPROBANTE, LUEGO CAMBIAR POR REAL
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

export async function createUser(user: UserFormType) {
  try {
    console.log("Creating user:", user);
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