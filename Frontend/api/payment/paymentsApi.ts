import { API_CONFIG } from "@/lib/config";
import { NewPaymentInput } from "@/lib/types";

const BASE_URL = API_CONFIG.PAYMENT_URL;
const FILES_URL = API_CONFIG.FILES_URL;



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

  const response = await fetch(`${BASE_URL}/new`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error en el servidor: ${response.status} - ${errorText}`)
  }

  return await response.json()
}

export async function createPaymentWithStatus(paymentData: Omit<NewPaymentInput, 'paymentStatus'>, isMercadoPagoPayment: boolean = false) {
  const paymentStatus = isMercadoPagoPayment ? "paid" : "pending"
  const formData = new FormData()

  const payment = {
    clientDni: paymentData.clientDni,
    amount: paymentData.amount,
    createdAt: new Date(paymentData.createdAt + "T00:00:00").toISOString().slice(0, 19),
    expiresAt: new Date(paymentData.expiresAt + "T00:00:00").toISOString().slice(0, 19),
    paymentStatus,
  }

  formData.append("payment", new Blob([JSON.stringify(payment)], { type: "application/json" }))

  if (paymentData.file) {
    formData.append("file", paymentData.file)
  }

  const response = await fetch(`${BASE_URL}/new`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error en el servidor: ${response.status} - ${errorText}`)
  }

  const result = await response.json()

  if (isMercadoPagoPayment && result.id) {
    try {
      await updatePayment(result.id, "paid")
    } catch (error) {
      // Silencioso - no romper si falla la activación
    }
  }

  return result
}



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
    const response = await fetch(`${BASE_URL}/pending/${id}`, {
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
  return `${FILES_URL}/${receiptId}`
}


