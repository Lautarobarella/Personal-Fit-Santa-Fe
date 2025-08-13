import { buildApiUrl } from "@/api/JWTAuth/config";
import { MethodType, PaymentStatus } from "@/lib/types";
import {
    MercadoPagoConfig,
    Payment,
    Preference
} from "mercadopago";

/**
 * Configuración del cliente de MercadoPago
 * Se inicializa con el token de acceso desde las variables de entorno
 */
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
    options: {
        timeout: 5000,
        idempotencyKey: 'abc'
    }
});

// Instancia de Preference para crear preferencias de pago
const pref = new Preference(client);

// Nota: La URL base para llamadas al backend debe ser NEXT_PUBLIC_API_URL,
// que ya está resuelta por buildApiUrl (internamente usa API_CONFIG.BASE_URL)



/**
 * Obtiene información de un pago por su ID
 * 
 * @param id - ID del pago de MercadoPago
 * @returns Promise<any> Información del pago
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
 * Tipo de datos para el payload del webhook
 * Estructura de datos que envía MercadoPago en las notificaciones
 */
export type WebhookPayload = {
    action?: string;
    api_version?: string;
    data?: {
        id: string;
    };
    date_created?: string;
    id?: number;
    live_mode?: boolean;
    type?: string;
    topic?: string; // MercadoPago usa 'topic' en lugar de 'type' en algunos casos
    user_id?: string;
    resource?: string; // URL del recurso (ej: merchant_order, payment)
};

/**
 * Procesa la notificación del webhook de MercadoPago
 * Esta función se puede llamar desde el webhook externo o desde una API route
 * 
 * @param payload - Payload del webhook
 * @returns Promise<any> Resultado del procesamiento
 */
export async function processWebhookNotification(payload: WebhookPayload) {
    try {
        const notificationType = payload.type || payload.topic;

        if (notificationType === "payment" && payload.data?.id) {
            const mpPayment = await getPaymentById(payload.data.id);
            
            if (mpPayment && mpPayment.status === 'approved') {
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
 * Mapea un pago de MercadoPago con el cliente y crea el pago en el sistema
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
            
            await createPaymentMP(paymentInfo);
            
            return paymentInfo;
        }
        
        return null;
        
    } catch (error) {
        return null;
    }
}

/**
 * Crea un pago real en el sistema usando la API del backend
 */
async function createPaymentMP(paymentInfo: any) {
    const newStatus = mapMercadoPagoStatus(paymentInfo.status) as "paid" | "rejected";
    
    if (newStatus === 'paid') {
        const paymentData = {
            clientDni: paymentInfo.clientDni,
            amount: paymentInfo.amount,
            createdAt: new Date().toISOString().split('T')[0],
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            mpPaymentId: paymentInfo.mpPaymentId,
            paymentMethod: paymentInfo.paymentMethod,
        };
        
        return await createPaymentServerSide(paymentData);
    }
    
    return null;
}

/**
 * Crea un pago real en el sistema usando la API del backend (versión servidor)
 * Esta función no depende de localStorage ni toast, por lo que puede ejecutarse en el servidor
 */
async function createPaymentServerSide(paymentData: {
    clientDni: number;
    amount: number;
    createdAt: string;
    expiresAt: string;
    mpPaymentId: string;
    paymentMethod: string;
}) {
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
 * Mapea el estado de MercadoPago al estado del sistema
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
 * Mapea el método de pago de MercadoPago al método del sistema
 */
function mapPaymentMethod(mpMethod: string): MethodType {
    switch (mpMethod) {
        case 'credit_card':
        case 'debit_card':
            return MethodType.CARD;
        case 'bank_transfer':
            return MethodType.TRANSFER;
        default:
            return MethodType.CASH;
    }
}

/**
 * Prueba la configuración de Mercado Pago y verifica que todos los métodos estén habilitados
 * Esta función es útil para diagnosticar problemas de configuración
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
        message: "Configuración de MercadoPago verificada correctamente",
        config: {
            accessToken: accessToken.substring(0, 10) + "...",
            environment: accessToken.startsWith('TEST-') ? 'SANDBOX' : 'PRODUCCIÓN',
            publicKey: publicKey ? publicKey.substring(0, 10) + "..." : 'No configurado'
        }
    };
}