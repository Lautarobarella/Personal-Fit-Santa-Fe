import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { buildFileUrl } from "@/api/JWTAuth/config";
import { handleApiError, handleValidationError, isValidationError } from "@/lib/error-handler";
import { NewPaymentInput, PaymentStatus, PaymentType } from "@/lib/types";

/**
 * API unificada para manejo de pagos
 * Combina funcionalidad de pagos y checkout de MercadoPago
 */

// ===== OPERACIONES DE CONSULTA =====

/**
 * Obtiene todos los pagos (para admin)
 */
export async function fetchAllPayments(): Promise<PaymentType[]> {
  try {
    return await jwtPermissionsApi.get('/api/payments/getAll');
  } catch (error) {
    handleApiError(error, 'Error al cargar los pagos');
    return [];
  }
}

/**
 * Obtiene pagos de un usuario específico
 */
export async function fetchUserPayments(userId: number): Promise<PaymentType[]> {
  try {
    return await jwtPermissionsApi.get(`/api/payments/${userId}`);
  } catch (error) {
    handleApiError(error, 'Error al cargar los pagos del usuario');
    return [];
  }
}

/**
 * Obtiene detalles de un pago específico con URL de comprobante
 */
export async function fetchPaymentDetails(paymentId: number): Promise<PaymentType & { receiptUrl: string | null }> {
  try {
    const payment = await jwtPermissionsApi.get(`/api/payments/info/${paymentId}`);
    return {
      ...payment,
      receiptUrl: buildReceiptUrl(payment.receiptId)
    };
  } catch (error) {
    handleApiError(error, 'Error al cargar los detalles del pago');
    throw error;
  }
}

// ===== OPERACIONES DE CREACIÓN =====

/**
 * Crea un nuevo pago (manual o automático)
 * @param paymentData - Datos del pago
 * @param isAutomaticPayment - Si es pago automático (MercadoPago) o manual
 */
export async function createPayment(
  paymentData: Omit<NewPaymentInput, 'paymentStatus'>,
  isAutomaticPayment: boolean = false
) {
  const paymentStatus = isAutomaticPayment ? PaymentStatus.PAID : PaymentStatus.PENDING;
  const formData = new FormData();

  const payment = {
    clientDni: paymentData.clientDni,
    amount: paymentData.amount,
    createdAt: new Date(paymentData.createdAt + "T00:00:00").toISOString().slice(0, 19),
    expiresAt: new Date(paymentData.expiresAt + "T00:00:00").toISOString().slice(0, 19),
    paymentStatus,
  };

  formData.append("payment", new Blob([JSON.stringify(payment)], { type: "application/json" }));

  if (paymentData.file) {
    formData.append("file", paymentData.file);
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

// ===== OPERACIONES DE ACTUALIZACIÓN =====

/**
 * Actualiza el estado de un pago (aprobar/rechazar)
 */
export async function updatePaymentStatus(
  paymentId: number,
  status: "paid" | "rejected",
  rejectionReason?: string
) {
  try {
    return await jwtPermissionsApi.put(`/api/payments/pending/${paymentId}`, {
      status,
      rejectionReason
    });
  } catch (error) {
    if (isValidationError(error)) {
      handleValidationError(error);
    } else {
      handleApiError(error, 'Error al actualizar el pago');
    }
    throw error;
  }
}

// ===== MERCADOPAGO CHECKOUT =====

/**
 * Crea una preferencia de pago en MercadoPago
 * @param productId - ID del producto
 * @param productName - Nombre del producto
 * @param productPrice - Precio del producto
 * @param userEmail - Email del usuario
 * @param userDni - DNI del usuario
 * @returns Promise<any> Respuesta de MercadoPago
 */
export async function createCheckoutPreference(
  productId: string,
  productName: string,
  productPrice: number,
  userEmail: string,
  userDni: string
): Promise<any> {
  try {
    return await jwtPermissionsApi.post('/payments/mercadopago/checkout', {
      productId,
      productName,
      productPrice,
      userEmail,
      userDni
    });
  } catch (error) {
    handleApiError(error, 'Error al crear la preferencia de pago');
    throw error;
  }
}

// ===== UTILIDADES =====

/**
 * Construye la URL del comprobante de pago
 */
export function buildReceiptUrl(receiptId: number | null | undefined): string | null {
  return buildFileUrl(receiptId);
}


