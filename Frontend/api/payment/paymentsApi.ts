import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { buildFileUrl } from "@/api/JWTAuth/config";
import { handleApiError, handleValidationError, isValidationError } from "@/lib/error-handler";
import { NewPaymentInput } from "@/lib/types";

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
    return await jwtPermissionsApi.post('/api/payments/new', formData);
  } catch (error) {
    if (isValidationError(error)) {
      handleValidationError(error);
    } else {
      handleApiError(error, 'Error al crear el pago');
    }
    throw error;
  }
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

  try {
    const result = await jwtPermissionsApi.post('/api/payments/new', formData);

    if (isMercadoPagoPayment && result.id) {
      try {
        await updatePayment(result.id, "paid")
      } catch (error) {
        // Silencioso - no romper si falla la activación
      }
    }

    return result;
  } catch (error) {
    if (isValidationError(error)) {
      handleValidationError(error);
    } else {
      handleApiError(error, 'Error al crear el pago');
    }
    throw error;
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
    if (isValidationError(error)) {
      handleValidationError(error);
    } else {
      handleApiError(error, 'Error al actualizar el pago');
    }
    throw error;
  }
}

export function buildReceiptUrl(receiptId: number | null | undefined): string | null {
  return buildFileUrl(receiptId);
}


