import { jwtPermissionsApi } from "@/api/JWTAuth/api";
import { buildFileUrl } from "@/api/JWTAuth/config";
import { handleApiError, handleValidationError, isValidationError } from "@/lib/error-handler";
import { compressFile, formatFileSize, validatePaymentFile } from "@/lib/file-compression";
import { MonthlyRevenue, NewPaymentInput, PaymentStatus, PaymentType } from "@/lib/types";

/**
 * Unified Payment API Wrapper
 * 
 * Centralizes all payment-related HTTP requests, bridging the frontend with the 
 * backend standard payments controller and MercadoPago integrations.
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
    return await jwtPermissionsApi.get('/api/payments/getAll');
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
    return await jwtPermissionsApi.get(`/api/payments/getAll/${year}/${month}`);
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
    return await jwtPermissionsApi.get(`/api/payments/${userId}`);
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
 * Handles both:
 * 1. Manual Cash/Transfer payments (with optional receipt file upload)
 * 2. Automated MercadoPago callbacks (no file, auto-approved)
 * 
 * Includes client-side compression logic to optimize upload bandwidth usage.
 * 
 * @param paymentData Form data including amount, notes, dates, etc.
 * @param isAutomaticPayment Boolean flag affecting the initial status (PAID vs PENDING)
 */
export async function createPayment(
  paymentData: Omit<NewPaymentInput, 'paymentStatus'>,
  isAutomaticPayment: boolean = false
) {
  // Automatic payments (MP) default to PAID, manual uploads must be verified by Admin (PENDING)
  const paymentStatus = isAutomaticPayment ? PaymentStatus.PAID : PaymentStatus.PENDING;
  const formData = new FormData();

  const payment = {
    // Dynamic handling: supports batch updates (clientDnis) or single user (clientDni)
    ...(paymentData.clientDnis ? { clientDnis: paymentData.clientDnis } : { clientDni: paymentData.clientDni }),
    createdByDni: paymentData.createdByDni,
    amount: paymentData.amount,
    // Format dates to ISO String, stripping time component for standard comparison
    createdAt: new Date(paymentData.createdAt + "T00:00:00").toISOString().slice(0, 19),
    expiresAt: new Date(paymentData.expiresAt + "T00:00:00").toISOString().slice(0, 19),
    paymentStatus,
    methodType: paymentData.method,
    notes: paymentData.notes,
  };

  // Append complex object as JSON blob part
  formData.append("payment", new Blob([JSON.stringify(payment)], { type: "application/json" }));

  // File Processing Pipeline (Manual Payments Only)
  if (paymentData.file && !isAutomaticPayment) {
    try {
      // Step 1: Structural Validation (size, mime-type)
      const validation = validatePaymentFile(paymentData.file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Step 2: Lossy Compression to reduce storage load
      const { compressedFile, originalSize, compressedSize, compressionRatio } = await compressFile(paymentData.file);

      // Step 3: Append optimized binary
      formData.append("file", compressedFile);
    } catch (compressionError) {
      console.error('Error al comprimir archivo:', compressionError);
      // Fallback Strategy: If compression fails (e.g. browser incompatibility), 
      // upload the original file rather than blocking the user transaction.
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
// MERCADOPAGO INTEGRATION
// ==========================================

/**
 * Preference Generator
 * 
 * Initializes a transaction intent with MercadoPago's API.
 * The returned ID is used to mount the Checkout Pro widget.
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

// ==========================================
// ANALYTICS & REVENUE
// ==========================================

/**
 * Retrieves historical financial data for reporting.
 * Access restricted to Admin role.
 */
export async function fetchArchivedMonthlyRevenues(): Promise<MonthlyRevenue[]> {
  try {
    return await jwtPermissionsApi.get('/api/payments/revenue/history');
  } catch (error) {
    handleApiError(error, 'Error al cargar el historial de ingresos');
    return [];
  }
}


