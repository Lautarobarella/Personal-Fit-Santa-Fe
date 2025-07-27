const BASE_URL = 'http://localhost:8080/api/payment';

import { mockPayments } from "@/mocks/mockPayments";

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
// MOCKS, LUEGO REEMPLAZAR EL USO POR LOS FETCHS REALES

export async function fetchPaymentDetailMock(id: number) {
  const payment = mockPayments.find(p => p.clientId === id)
  if (!payment) {
    console.log("Payment not found for ID:", id);
    return new Response("Pago no encontrado", { status: 404 })
  }
  console.log("Payment detail fetched for ID:", id, payment)
  return new Response(JSON.stringify(payment), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}
// MOCKS, LUEGO REEMPLAZAR EL USO POR LOS FETCHS REALES

export async function fetchPaymentsById(id: number) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
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

export async function fetchPendingPaymentDetail() {
  try {
    const response = await fetch(`${BASE_URL}/info/pending`, {
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