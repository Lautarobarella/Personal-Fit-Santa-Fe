import { buildApiUrl } from "@/api/JWTAuth/config";
import { MethodType, PaymentStatus } from "@/lib/types";
import {
    MercadoPagoConfig,
    Payment,
    Preference
} from "mercadopago";

/**
 * MercadoPago Client Configuration
 * Initializes the SDK with the secure Access Token.
 * Note: Only safe to run in a server-side context (Next.js API Routes or Server Components).
 */
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
    options: {
        timeout: 5000,
        idempotencyKey: 'abc'
    }
});

// Instance for creating Payment Preferences (User Checkout Flow)
const pref = new Preference(client);

// Note: The base URL for backend calls should rely on the standardized configuration
// to avoid environment mismatches (Local/Production).

/**
 * Retrieve Payment Information
 * Fetches the status of a specific transaction directly from MercadoPago's API.
 * 
 * @param id - The unique MercadoPago Payment ID
 * @returns Promise<any> Raw payment data
 */
export async function getPaymentById(id: string) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error('Token de acceso de MercadoPago no configurado');
    }

    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id });
    return paymentInfo;
}

/**
 * Webhook Payload Interface
 * Represents the JSON structure sent by MercadoPago during an IPN (Instant Payment Notification).
 */
export type WebhookPayload = {
    action?: string;
    api_version?: string;
    data?: {
        id: string; // The ID of the resource (e.g., payment ID)
    };
    date_created?: string;
    id?: number;
    live_mode?: boolean;
    type?: string;
    topic?: string; // Legacy parameter, synonymous with 'type'
    user_id?: string;
    resource?: string; // Full URI of the resource
};

/**
 * Webhook Processor
 * The core logic for handling incoming notifications from MercadoPago.
 * 
 * Flow:
 * 1. Identify notification type (we care about 'payment')
 * 2. Fetch the full payment details from MP to verify authenticity (security step)
 * 3. If Approved, map the data to our system domain
 * 4. Trigger creation of a permanent payment record
 * 
 * @param payload - The lightweight notification body
 * @returns Result object summarizing the action taken
 */
export async function processWebhookNotification(payload: WebhookPayload) {
    try {
        const notificationType = payload.type || payload.topic;

        // We only process final payment notifications (not pending, not merchant_orders)
        if (notificationType === "payment" && payload.data?.id) {
            const mpPayment = await getPaymentById(payload.data.id);

            if (mpPayment && mpPayment.status === 'approved') {
                // Map external MP data to internal Client structure
                const clientInfo = await mapPaymentToClient(mpPayment);

                return {
                    success: true,
                    paymentId: mpPayment.id,
                    status: mpPayment.status,
                    externalReference: mpPayment.external_reference,
                    amount: mpPayment.transaction_amount,
                    paymentMethod: mpPayment.payment_method?.type,
                    paymentMethodId: mpPayment.payment_method_id,
                    installments: mpPayment.installments,
                    clientInfo: clientInfo,
                    processedAt: new Date().toISOString(),
                };
            }
        }

        return {
            success: false,
            message: "Tipo de notificación no procesado",
            type: notificationType
        };

    } catch (error) {
        throw new Error(`Error al procesar notificación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
}

/**
 * Mapper: External -> Internal
 * Decodes the 'external_reference' field to identify which User and Product this payment belongs to.
 * 
 * Structure: "DNI-ProductID-Timestamp-Salt"
 */
async function mapPaymentToClient(mpPayment: any) {
    try {
        const externalRef = mpPayment.external_reference;

        if (!externalRef) {
            return null;
        }

        const parts = externalRef.split('-');
        if (parts.length >= 3) {
            const userDni = parseInt(parts[0]);
            const productId = parts[1];

            const paymentInfo = {
                productId: productId,
                productName: 'Cuota mensual gimnasio',
                transactionId: externalRef,
                amount: mpPayment.transaction_amount,
                currency: mpPayment.currency_id,
                paymentDate: mpPayment.date_created,
                status: mpPayment.status,
                paymentMethod: mpPayment.payment_method?.type || 'N/A',
                paymentMethodId: mpPayment.payment_method_id,
                installments: mpPayment.installments,
                mpPaymentId: mpPayment.id,
                clientDni: userDni,
            };

            // Trigger internal persistence
            await createPaymentMP(paymentInfo);

            return paymentInfo;
        }

        return null;

    } catch (error) {
        return null;
    }
}

/**
 * Internal Logic: Payment Creation Wrapper
 * Conditional logic to ensure we only save 'meaningful' payments (e.g. Paid/Rejected).
 */
async function createPaymentMP(paymentInfo: any) {
    const newStatus = mapMercadoPagoStatus(paymentInfo.status) as "paid" | "rejected";

    if (newStatus === 'paid') {
        const paymentData = {
            clientDni: paymentInfo.clientDni,
            amount: paymentInfo.amount,
            createdAt: new Date().toISOString().split('T')[0],
            // Auto-calculate expiration date (30 days from now) for the membership
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            mpPaymentId: paymentInfo.mpPaymentId,
            paymentMethod: paymentInfo.paymentMethod,
        };

        return await createPaymentServerSide(paymentData);
    }

    return null;
}

/**
 * Server-Side API Caller
 * 
 * Used during webhook execution (server context). 
 * Directs the request to the internal backend API to persist the transaction record.
 * Avoids using client-side auth tokens, relying purely on the network layer trust.
 */
async function createPaymentServerSide(paymentData: {
    clientDni: number;
    amount: number;
    createdAt: string;
    expiresAt: string;
    mpPaymentId: string;
    paymentMethod: string;
}) {
    // Construct the backend URL
    const url = buildApiUrl('/api/payments/webhook/mercadopago');

    const payment = {
        clientDni: paymentData.clientDni,
        amount: paymentData.amount,
        createdAt: new Date(paymentData.createdAt).toISOString().slice(0, 19),
        expiresAt: new Date(paymentData.expiresAt + "T00:00:00").toISOString().slice(0, 19),
        paymentStatus: PaymentStatus.PAID,
        confNumber: paymentData.mpPaymentId,
        methodType: mapPaymentMethod(paymentData.paymentMethod),
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payment),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    return await response.json();
}

/**
 * Status Normalizer
 * Maps standard MP statuses to our system's Enums.
 */
function mapMercadoPagoStatus(mpStatus: string): string {
    switch (mpStatus) {
        case 'approved':
            return 'paid';
        case 'pending':
            return 'pending';
        case 'rejected':
        case 'cancelled':
            return 'rejected';
        default:
            return 'pending';
    }
}

/**
 * Payment Method Normalizer
 * Simplifies the granular MP methods (credit_card, debit_card) into our system types.
 */
function mapPaymentMethod(mpMethod: string): MethodType {
    switch (mpMethod) {
        case 'credit_card':
        case 'debit_card':
            return MethodType.CARD;
        case 'bank_transfer':
            return MethodType.TRANSFER;
        default:
            return MethodType.MERCADOPAGO;
    }
}

/**
 * Configuration Sentinel
 * Safe utility to check if MP is correctly configured in the current environment.
 * Useful for health checks or debugging.
 */
export async function testMercadoPagoConfiguration() {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

    if (!accessToken) {
        return {
            success: false,
            error: 'Token de acceso de MercadoPago no configurado'
        };
    }

    return {
        success: true,
        message: "Configuración de MercadoPago verificada",
        config: {
            accessToken: accessToken.substring(0, 10) + "...",
            environment: accessToken.startsWith('TEST-') ? 'SANDBOX' : 'PRODUCCIÓN',
            publicKey: publicKey ? publicKey.substring(0, 10) + "..." : 'No configurado'
        }
    };
}
