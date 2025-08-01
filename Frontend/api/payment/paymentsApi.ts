import { NewPaymentInput } from "@/lib/types";

const BASE_URL = 'http://localhost:8080/api/payment';
const FILES_URL = 'http://localhost:8080/api/files';
const URL_TOMI = 'http://152.170.128.205:8080/api/payment';
const URL_TOMI_FILES = 'http://152.170.128.205:8080/api/files';


export async function fetchPayments() {
  try {
    const response = await fetch(`${URL_TOMI}/getAll`, {
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

export async function createPayment(paymentData: NewPaymentInput) {
  const {
    clientDni,
    amount,
    createdAt,
    expiresAt,
    file,
    paymentStatus,
  } = paymentData

  const formData = new FormData()

  const payment = {
    clientDni,
    amount,
    createdAt: new Date(createdAt + "T00:00:00").toISOString().slice(0, 19),
    expiresAt: new Date(expiresAt + "T00:00:00").toISOString().slice(0, 19),
    paymentStatus,
  }

  formData.append("payment", new Blob([JSON.stringify(payment)], { type: "application/json" }))

  if (file) {
    formData.append("file", file)
  }

  const response = await fetch(`${URL_TOMI}/new`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error en el servidor: ${response.status} - ${errorText}`)
  }

  return await response.json()
}



export async function fetchPaymentsById(id: number) {
  try {
    const response = await fetch(`${URL_TOMI}/${id}`, {
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
    return [];
  }
}

export async function fetchPaymentDetail(id: number) {
  try {
    const response = await fetch(`${URL_TOMI}/info/${id}`, {
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
    throw error;
  }
}

export async function fetchPendingPaymentDetail() {
  try {
    const response = await fetch(`${URL_TOMI}/info/pending`, {
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
    const response = await fetch(`${URL_TOMI}/pending/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, rejectionReason }),
    });

    if (!response.ok) {
      throw new Error(`Error al actualizar el pago: ${response.status}`);
    }

    // Como el backend ahora devuelve un mensaje simple (String), podés hacer esto:
    return await response.text(); // o ignorar el cuerpo si no lo usás

  } catch (error) {
    console.error('Error updating payment:', error);
    throw error;
  }
}

export function buildReceiptUrl(receiptId: number | null | undefined): string | null {
  if (!receiptId) return null
  return `${URL_TOMI_FILES}/${receiptId}`
}


