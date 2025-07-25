const BASE_URL = 'http://152.170.128.205:8080/api/payment';

export async function fetchPayments() {
  try {
    const response = await fetch(`${BASE_URL}/getAll`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener los pagos: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
}

export async function fetchPaymentsById(id: number) {
  try {
    const response = await fetch(`${BASE_URL}/get/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener los pagos: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
}

export async function fetchPaymentDetail(id: number) {
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
    console.error('Error fetching payment:', error);
    throw error;
  }
}

export async function updatePayment(id: number, status: "paid" | "rejected", rejectionReason?: string) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, rejectionReason }),
    });

    if (!response.ok) {
      throw new Error(`Error al actualizar el pago: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error updating payment:', error);
    throw error;
  }
}