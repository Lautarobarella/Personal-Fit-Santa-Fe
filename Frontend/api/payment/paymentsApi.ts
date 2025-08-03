import { jwtPermissionsApi } from "@/lib/api";
import { NewPaymentInput } from "@/lib/types";
import { handleApiError, isValidationError, handleValidationError } from "@/lib/error-handler";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function fetchPayments() {
  try {
    return await jwtPermissionsApi.get('/api/payments/getAll');
  } catch (error) {
    handleApiError(error, 'Error al cargar los pagos');
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

  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/new`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Error al crear el pago')
    }

    return await response.json()
  } catch (error) {
    handleApiError(error, 'Error al crear el pago')
    throw error
  }
}

export async function fetchPaymentsById(id: number) {
  try {
    return await jwtPermissionsApi.get(`/api/payments/${id}`);
  } catch (error) {
    handleApiError(error, 'Error al cargar el pago');
    return [];
  }
}

export async function fetchPaymentDetail(id: number) {
  try {
    return await jwtPermissionsApi.get(`/api/payments/info/${id}`);
  } catch (error) {
    handleApiError(error, 'Error al cargar los detalles del pago');
    throw error;
  }
}

export async function fetchPendingPaymentDetail() {
  try {
    return await jwtPermissionsApi.get('/api/payments/info/pending');
  } catch (error) {
    handleApiError(error, 'Error al cargar los pagos pendientes');
    throw error;
  }
}

export async function updatePayment(id: number, status: "paid" | "rejected", rejectionReason?: string) {
  try {
    return await jwtPermissionsApi.put(`/api/payments/pending/${id}`, { status, rejectionReason });
  } catch (error) {
    handleApiError(error, 'Error al actualizar el pago');
    throw error;
  }
}

export function buildReceiptUrl(receiptId: number | null | undefined): string | null {
  if (!receiptId) return null
  return `${API_BASE_URL}/api/files/${receiptId}`
}


