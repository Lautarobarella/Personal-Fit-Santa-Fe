import { UserDetailInfo, UserType } from "@/lib/types";

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

    const user: UserDetailInfo = await response.json();
    
    return user;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}