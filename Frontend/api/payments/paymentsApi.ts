import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { buildFileUrl } from "@/api/JWTAuth/config";
import { handleApiError, handleValidationError, isValidationError } from "@/lib/error-handler";
import { compressFile, validatePaymentFile } from "@/lib/file-compression";
import { NewPaymentInput, PaymentType } from "@/lib/types";

/**
 * Unified Payment API Wrapper
 * 
 * Centralizes all payment-related HTTP requests for the standard backend
 * payment controller.
 * 
 * Features:
 * - Error standardization (handleApiError)
 * - Compression and validation middleware for receipt images
 * - Type-safe response handling
 */

// ==========================================
// QUERY OPERATIONS (READ)
// ==========================================

/**
 * Validates and retrieves the full administrative payment history.
 * @returns {Promise<PaymentType[]>} List of all payments in the system.
 */
export async function fetchAllPayments(): Promise<PaymentType[]> {
  try {
    // El cliente API devuelve null ante respuestas vacías o no-JSON; garantizar
    // array para que los .filter()/.map() de los consumidores nunca exploten.
    const response = await jwtPermissionsApi.get('/api/payments/getAll');
    return Array.isArray(response) ? response : [];
  } catch (error) {
    handleApiError(error, 'Error al cargar los pagos');
    return [];
  }
}

/**
 * Retrieves payment history filtered by time period.
 * Optimization: Uses backend filtering instead of client-side filtering for performance.
 * 
 * @param year Full four-digit year (e.g., 2024)
 * @param month 1-indexed month (1 = January, 12 = December)
 */
export async function fetchPaymentsByMonthAndYear(year: number, month: number): Promise<PaymentType[]> {
  try {
    const response = await jwtPermissionsApi.get(`/api/payments/getAll/${year}/${month}`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    handleApiError(error, 'Error al cargar los pagos del mes');
    return [];
  }
}

/**
 * Retrieves the specific payment history for a single user context.
 * Used in the "My Payments" section of the client dashboard.
 * 
 * @param userId Unique identifier of the authenticated user
 */
export async function fetchUserPayments(userId: number): Promise<PaymentType[]> {
  try {
    const response = await jwtPermissionsApi.get(`/api/payments/${userId}`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    handleApiError(error, 'Error al cargar los pagos del usuario');
    return [];
  }
}

/**
 * Fetches detailed metadata for a single transaction, including the 
 * signed URL for accessing the receipt image.
 * 
 * @param paymentId The unique ID of the payment
 * @returns {Promise<PaymentType & { receiptUrl: string | null }>} Augmented payment object
 */
export async function fetchPaymentDetails(paymentId: number): Promise<PaymentType & { receiptUrl: string | null }> {
  try {
    const payment = await jwtPermissionsApi.get(`/api/payments/info/${paymentId}`);
    return {
      ...payment,
      // Helper function transforms the raw ID into a resolvable static asset URL
      receiptUrl: buildReceiptUrl(payment.receiptId)
    };
  } catch (error) {
    handleApiError(error, 'Error al cargar los detalles del pago');
    throw error;
  }
}

// ==========================================
// CREATION OPERATIONS (CREATE)
// ==========================================

/**
 * Proxy function for Payment Creation.
 * Handles both manual uploads and automatic admin registrations.
 * 
 * Includes client-side compression logic to optimize upload bandwidth usage.
 * 
 * Identity, amount, status and dates are deliberately omitted. The backend
 * derives them from the authenticated principal and current settings.
 */
export async function createPayment(paymentData: NewPaymentInput) {
  const formData = new FormData();

  const payment = {
    clientDnis: paymentData.clientDnis,
    expectedMonthlyFee: paymentData.expectedMonthlyFee,
    methodType: paymentData.method,
    notes: paymentData.notes,
  };

  // Append complex object as JSON blob part
  formData.append("payment", new Blob([JSON.stringify(payment)], { type: "application/json" }));

  // A receipt belongs to the operation independently of whether its creator is
  // a client or an admin. Group transfers therefore upload one shared receipt.
  if (paymentData.file) {
    const validation = validatePaymentFile(paymentData.file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      const { compressedFile } = await compressFile(paymentData.file);
      formData.append("file", compressedFile);
    } catch (compressionError) {
      console.error('Error al comprimir archivo:', compressionError);
      formData.append("file", paymentData.file);
    }
  }

  try {
    return await jwtPermissionsApi.post('/api/payments/new', formData);
  } catch (error) {
    // Discriminate between 400 Bad Request (Validation) and 500 Server Error
    if (isValidationError(error)) {
      handleValidationError(error);
    } else {
      handleApiError(error, 'Error al crear el pago');
    }
    throw error;
  }
}

/**
 * Quick payment load for inactive clients (Admin only).
 *
 * Sends the selected client DNIs plus the monthly fee the admin saw when
 * confirming: the backend re-validates eligibility (INACTIVE clients without
 * a pending payment for the current month), computes the amount server-side
 * from the configured monthly fee — rejecting the operation if it no longer
 * matches the expected one —, forces PAID status and resolves the creator
 * from the authenticated session.
 *
 * @param clientDnis         DNIs of the selected inactive clients
 * @param expectedMonthlyFee Monthly fee shown to the admin in the dialog
 */
export async function createInactiveClientsPayment(
  clientDnis: number[],
  expectedMonthlyFee: number
): Promise<{
  success: boolean;
  message: string;
  paymentId: number;
  clientCount: number;
}> {
  try {
    return await jwtPermissionsApi.post('/api/payments/inactive-group', { clientDnis, expectedMonthlyFee });
  } catch (error) {
    if (isValidationError(error)) {
      handleValidationError(error);
    } else {
      handleApiError(error, 'Error al generar los pagos');
    }
    throw error;
  }
}

// ==========================================
// UPDATE OPERATIONS (UPDATE)
// ==========================================

/**
 * State Transition Handler
 * Allows Admins to Approve or Reject a submitted payment proof.
 * 
 * @param paymentId Target payment
 * @param status valid next state ('paid' | 'rejected')
 * @param rejectionReason Optional text required only when status is 'rejected'
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

// ==========================================
// UTILITIES
// ==========================================

/**
 * Utility: Receipt URL Builder
 * Encapsulates URL formatting logic to ensure consistency across the app.
 */
export function buildReceiptUrl(receiptId: number | null | undefined): string | null {
  return buildFileUrl(receiptId);
}

