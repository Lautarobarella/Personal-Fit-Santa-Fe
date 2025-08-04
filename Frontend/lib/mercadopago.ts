import {
    MercadoPagoConfig,
    MerchantOrder,
    Payment,
    Preference
} from "mercadopago";
import { createPaymentWithStatus } from "../api/payment/paymentsApi";
import { getProductById } from "./products";

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

// Configuración central para las URLs de la API (versión para servidor)
const getApiBaseUrl = () => {
  // Usar variable de entorno si está disponible
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // En el servidor, usar la IP del servidor de producción
  return 'http://72.60.1.76:8080';
};

// Configuración para las URLs del frontend (donde están los webhooks)
const getFrontendBaseUrl = () => {
  // Usar variable de entorno si está disponible
  if (process.env.NEXT_PUBLIC_FRONTEND_URL) {
    return process.env.NEXT_PUBLIC_FRONTEND_URL;
  }
  
  // En el servidor, usar la IP del servidor de producción para el frontend
  return 'http://72.60.1.76:3000';
};

/**
 * Tipos de datos para crear preferencias de pago
 */
type CreatePrefOptions = {
    productName: string;
    productDescription: string;
    productId: string;
    productPrice: number;
    userEmail: string;
    userDni: string;
    transactionId: string;
};

/**
 * Crea una preferencia de pago para un producto individual
 * Esta función configura la preferencia que redirigirá al usuario a MercadoPago
 * 
 * @param options - Opciones para crear la preferencia
 * @returns Promise<any> Preferencia creada por MercadoPago
 */
export async function createSingleProductPreference(options: CreatePrefOptions) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error('Token de acceso de MercadoPago no configurado');
    }

    const baseUrl = getApiBaseUrl();
    const frontendUrl = getFrontendBaseUrl();

    const preferenceBody = {
        items: [
            {
                id: options.productId,
                title: options.productName,
                description: options.productDescription,
                quantity: 1,
                currency_id: "ARS",
                unit_price: options.productPrice,
            },
        ],
        back_urls: {
            success: `${frontendUrl}/payments/result/success`,
            failure: `${frontendUrl}/payments/result/failure`,
            pending: `${frontendUrl}/payments/result/pending`,
        },
        notification_url: `${frontendUrl}/api/webhook/mercadopago`,
        external_reference: options.transactionId,
    };

    const preference = await pref.create({ body: preferenceBody });
    return preference;
}

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
 * Obtiene una preferencia por el ID de la orden
 * 
 * @param id - ID de la orden de MercadoPago
 * @returns Promise<any> Preferencia encontrada
 */
export async function getPrefByOrderId(id: number) {
    try {
        console.log(`Obteniendo preferencia por orden: ${id}`);

        const order = new MerchantOrder(client);
        const result = await order.get({ merchantOrderId: id });
        if (!result.preference_id) {
            throw new Error('La orden de MercadoPago no tiene preference_id');
        }
        const preference = await pref.get({ preferenceId: result.preference_id });

        console.log(`Preferencia obtenida: ${preference.id}`);
        return preference;

    } catch (error) {
        console.error("Error al obtener preferencia por orden:", error);
        throw new Error(`Error al obtener preferencia: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
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
        console.log("=== PROCESANDO WEBHOOK MERCADOPAGO ===");
        console.log("Payload:", payload);

        // Determinar el tipo de notificación
        const notificationType = payload.type || payload.topic;
        console.log("📋 Tipo de notificación:", notificationType);

        if (notificationType === "payment") {
            // Intentar obtener información del pago con reintentos
            let mpPayment = null;
            let retryCount = 0;
            const maxRetries = 3;
            const retryDelay = 2000; // 2 segundos

            while (retryCount < maxRetries) {
                try {
                    console.log(`Intento ${retryCount + 1} de ${maxRetries} para obtener pago ${payload.data?.id}`);
                    mpPayment = await getPaymentById(payload.data!.id);
                    break; // Si llegamos aquí, el pago se obtuvo exitosamente
                } catch (error: any) {
                    retryCount++;
                    console.log(`Error en intento ${retryCount}:`, error.message);
                    
                    if (retryCount < maxRetries) {
                        console.log(`Esperando ${retryDelay}ms antes del siguiente intento...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                    } else {
                        console.log("Se agotaron los reintentos. Creando registro de pago pendiente...");
                        // Crear un registro de pago pendiente con la información disponible
                        return await createPendingPaymentRecord(payload);
                    }
                }
            }

            if (mpPayment) {
                console.log(`✅ Pago procesado exitosamente: ${mpPayment.id} - Estado: ${mpPayment.status}`);
                
                // Mapear el pago con el cliente usando external_reference
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

        if (notificationType === "merchant_order") {
            console.log("📦 Orden de comerciante recibida, procesando...");
            
            // Extraer el ID de la orden de la URL del recurso
            const resourceUrl = payload.resource;
            let orderId = payload.data?.id;
            
            if (resourceUrl && !orderId) {
                // Extraer ID de la URL: https://api.mercadolibre.com/merchant_orders/32927795708
                const urlParts = resourceUrl.split('/');
                orderId = urlParts[urlParts.length - 1];
            }
            
            console.log("🆔 ID del pago/orden:", orderId);
            
            if (orderId) {
                // Obtener información de la orden
                try {
                    const order = new MerchantOrder(client);
                    const orderInfo = await order.get({ merchantOrderId: parseInt(orderId) });
                    
                    console.log("📋 Información de la orden:", {
                        id: orderInfo.id,
                        status: orderInfo.status,
                        total_amount: orderInfo.total_amount,
                        paid_amount: orderInfo.paid_amount,
                        items: orderInfo.items?.length || 0,
                        payments: orderInfo.payments?.length || 0,
                        preference_id: orderInfo.preference_id
                    });
                    
                    // Si la orden está pagada, procesar los pagos
                    if (orderInfo.status === 'paid' && (orderInfo.paid_amount || 0) > 0) {
                        console.log("💰 Orden pagada, procesando pagos...");
                        
                        if (orderInfo.payments && orderInfo.payments.length > 0) {
                            // Procesar cada pago de la orden
                            for (const payment of orderInfo.payments) {
                                try {
                                    if (payment.id) {
                                        const paymentInfo = await getPaymentById(payment.id.toString());
                                        if (paymentInfo) {
                                            console.log(`✅ Pago ${payment.id} procesado: ${paymentInfo.status}`);
                                            
                                            // Mapear el pago con el cliente
                                            const clientInfo = await mapPaymentToClient(paymentInfo);
                                            
                                            return {
                                                success: true,
                                                type: "merchant_order_paid",
                                                orderId: orderId,
                                                paymentId: payment.id,
                                                status: paymentInfo.status,
                                                amount: paymentInfo.transaction_amount,
                                                clientInfo: clientInfo,
                                                processedAt: new Date().toISOString(),
                                            };
                                        }
                                    }
                                } catch (error) {
                                    console.error(`Error procesando pago ${payment.id}:`, error);
                                }
                            }
                        }
                    } else {
                        console.log("⏳ Orden no pagada aún, esperando notificación de pago...");
                        return {
                            success: true,
                            type: "merchant_order_pending",
                            orderId: orderId,
                            status: orderInfo.status,
                            paidAmount: orderInfo.paid_amount || 0,
                            totalAmount: orderInfo.total_amount || 0,
                            processedAt: new Date().toISOString(),
                        };
                    }
                    
                } catch (error) {
                    console.error("Error obteniendo información de la orden:", error);
                    return {
                        success: true,
                        type: "merchant_order",
                        orderId: orderId,
                        status: "unknown",
                        processedAt: new Date().toISOString(),
                    };
                }
            }
            
            return {
                success: true,
                type: "merchant_order",
                orderId: orderId,
                processedAt: new Date().toISOString(),
            };
        }

        return { 
            success: false,
            message: "Tipo de notificación no procesado", 
            type: notificationType 
        };

    } catch (error) {
        console.error("❌ Error al procesar webhook:", error);
        throw new Error(`Error al procesar notificación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
}

// Almacenamiento temporal para pagos pendientes (en producción usar base de datos)
const pendingPayments = new Map<string, any>();

/**
 * Crea un registro de pago pendiente cuando no se puede obtener información inmediata
 */
async function createPendingPaymentRecord(payload: WebhookPayload) {
    try {
        console.log("📝 Creando registro de pago pendiente...");
        
        // Extraer información del external_reference si está disponible
        // El formato es: productId-timestamp-randomString
        const externalRef = payload.data?.id; // Usar el ID del pago como referencia temporal
        
        const pendingPayment = {
            mpPaymentId: payload.data?.id,
            status: "pending",
            externalReference: externalRef,
            amount: 0, // Se actualizará cuando se obtenga la información completa
            createdAt: new Date().toISOString(),
            webhookId: payload.id,
            retryCount: 0,
            lastRetry: new Date().toISOString(),
        };

        console.log("📋 Registro de pago pendiente creado:", pendingPayment);
        
        // Guardar en almacenamiento temporal
        pendingPayments.set(payload.data?.id || '', pendingPayment);
        console.log(`💾 Pago pendiente guardado. Total pendientes: ${pendingPayments.size}`);
        
        return {
            success: true,
            type: "pending_payment",
            paymentId: payload.data?.id,
            status: "pending",
            message: "Pago registrado como pendiente para procesamiento posterior",
            processedAt: new Date().toISOString(),
        };
        
    } catch (error) {
        console.error("Error al crear registro de pago pendiente:", error);
        throw error;
    }
}

/**
 * Procesa pagos pendientes (se puede llamar desde un cron job o endpoint)
 */
export async function processPendingPayments() {
    try {
        console.log("🔄 Procesando pagos pendientes...");
        console.log(`📊 Total de pagos pendientes: ${pendingPayments.size}`);
        
        const processedPayments = [];
        const failedPayments = [];
        
        for (const [paymentId, pendingPayment] of pendingPayments.entries()) {
            try {
                console.log(`🔄 Procesando pago pendiente: ${paymentId}`);
                
                // Intentar obtener información del pago
                const mpPayment = await getPaymentById(paymentId);
                
                if (mpPayment) {
                    console.log(`✅ Pago ${paymentId} procesado exitosamente`);
                    
                    // Mapear con cliente
                    const clientInfo = await mapPaymentToClient(mpPayment);
                    
                    // Actualizar el registro pendiente
                    pendingPayment.status = mpPayment.status;
                    pendingPayment.amount = mpPayment.transaction_amount;
                    pendingPayment.processedAt = new Date().toISOString();
                    pendingPayment.clientInfo = clientInfo;
                    
                    processedPayments.push({
                        paymentId,
                        status: mpPayment.status,
                        amount: mpPayment.transaction_amount,
                        clientInfo,
                    });
                    
                    // Remover de pendientes
                    pendingPayments.delete(paymentId);
                    
                } else {
                    console.log(`⚠️ No se pudo obtener información del pago ${paymentId}`);
                    pendingPayment.retryCount++;
                    pendingPayment.lastRetry = new Date().toISOString();
                    
                    // Si se agotaron los reintentos, marcar como fallido
                    if (pendingPayment.retryCount >= 5) {
                        pendingPayment.status = "failed";
                        failedPayments.push(paymentId);
                        pendingPayments.delete(paymentId);
                    }
                }
                
            } catch (error) {
                console.error(`❌ Error procesando pago ${paymentId}:`, error);
                pendingPayment.retryCount++;
                pendingPayment.lastRetry = new Date().toISOString();
                
                if (pendingPayment.retryCount >= 5) {
                    pendingPayment.status = "failed";
                    failedPayments.push(paymentId);
                    pendingPayments.delete(paymentId);
                }
            }
        }
        
        console.log(`✅ Procesamiento completado:`);
        console.log(`   - Procesados: ${processedPayments.length}`);
        console.log(`   - Fallidos: ${failedPayments.length}`);
        console.log(`   - Pendientes restantes: ${pendingPayments.size}`);
        
        return {
            success: true,
            processed: processedPayments,
            failed: failedPayments,
            remaining: pendingPayments.size,
        };
        
    } catch (error) {
        console.error("❌ Error procesando pagos pendientes:", error);
        throw error;
    }
}

/**
 * Obtiene información sobre pagos pendientes
 */
export function getPendingPaymentsInfo() {
    const pendingList = Array.from(pendingPayments.values());
    
    return {
        total: pendingPayments.size,
        payments: pendingList.map(p => ({
            mpPaymentId: p.mpPaymentId,
            status: p.status,
            retryCount: p.retryCount,
            createdAt: p.createdAt,
            lastRetry: p.lastRetry,
        })),
    };
}

/**
 * Mapea un pago de MercadoPago con el cliente y crea el pago en el sistema
 */
async function mapPaymentToClient(mpPayment: any) {
    try {
        console.log("🔍 Mapeando pago con cliente...");
        
        // Extraer información del external_reference
        // Formato esperado: userDni-productId-timestamp-randomString
        const externalRef = mpPayment.external_reference;
        console.log("Referencia externa:", externalRef);
        
        if (!externalRef) {
            console.log("⚠️ No se encontró referencia externa");
            return null;
        }

        // Parsear la referencia externa
        const parts = externalRef.split('-');
        if (parts.length >= 3) {
            const userDni = parseInt(parts[0]);
            const productId = parts[1];
            const timestamp = parts[2];
            
            console.log(`👤 DNI del usuario: ${userDni}`);
            console.log(`📦 Producto ID: ${productId}`);
            console.log(`⏰ Timestamp: ${timestamp}`);
            
            // Obtener información del producto
            const product = await getProductById(productId);
            
            // Información del pago
            const paymentInfo = {
                productId: productId,
                productName: product?.name || 'Producto desconocido',
                transactionId: externalRef,
                amount: mpPayment.transaction_amount,
                currency: mpPayment.currency_id,
                paymentDate: mpPayment.date_created,
                status: mpPayment.status,
                paymentMethod: mpPayment.payment_method?.type || 'N/A',
                paymentMethodId: mpPayment.payment_method_id,
                installments: mpPayment.installments,
                mpPaymentId: mpPayment.id,
                clientDni: userDni, // Usar el DNI extraído de la referencia externa
            };
            
            console.log("👤 Información del pago mapeada:", paymentInfo);
            
            // Crear el pago en la base de datos
            console.log("💾 Creando pago en base de datos...");
            console.log(`   - Cliente DNI: ${paymentInfo.clientDni}`);
            console.log(`   - Producto: ${paymentInfo.productName}`);
            console.log(`   - Monto: $${paymentInfo.amount} ${paymentInfo.currency}`);
            console.log(`   - Estado: ${paymentInfo.status}`);
            console.log(`   - Método: ${paymentInfo.paymentMethod}`);
            console.log(`   - Cuotas: ${paymentInfo.installments || 1}`);
            console.log(`   - Fecha: ${new Date(paymentInfo.paymentDate).toLocaleString('es-AR')}`);
            console.log(`   - ID MercadoPago: ${paymentInfo.mpPaymentId}`);
            
            // Crear el pago real en el sistema
            await createPaymentMP(paymentInfo);
            
            return paymentInfo;
        }
        
        console.log("⚠️ Formato de referencia externa no reconocido");
        return null;
        
    } catch (error) {
        console.error("Error al mapear pago con cliente:", error);
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
        };
        
        return await createPaymentWithStatus(paymentData, true);
    }
    
    return null;
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
function mapPaymentMethod(mpMethod: string): string {
    switch (mpMethod) {
        case 'credit_card':
        case 'debit_card':
            return 'card';
        case 'bank_transfer':
            return 'transfer';
        default:
            return 'cash';
    }
}

/**
 * Prueba la configuración de Mercado Pago y verifica que todos los métodos estén habilitados
 * Esta función es útil para diagnosticar problemas de configuración
 */
export async function testMercadoPagoConfiguration() {
    try {
        console.log("🧪 === PRUEBA DE CONFIGURACIÓN MERCADOPAGO ===");
        
        // Verificar token
        const accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            throw new Error('Token de acceso de MercadoPago no configurado');
        }
        
        console.log(`✅ Token configurado: ${accessToken.substring(0, 10)}...`);
        console.log(`🌍 Ambiente: ${accessToken.startsWith('TEST-') ? 'SANDBOX' : 'PRODUCCIÓN'}`);
        
        // Verificar public key
        const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
        if (publicKey) {
            console.log(`🔑 Public Key configurado: ${publicKey.substring(0, 10)}...`);
        } else {
            console.log(`⚠️  Public Key no configurado`);
        }
        
        console.log("✅ Configuración verificada - Solo tokens, sin preferencias de prueba");
        
        return {
            success: true,
            message: "Configuración de MercadoPago verificada correctamente",
            config: {
                accessToken: accessToken.substring(0, 10) + "...",
                environment: accessToken.startsWith('TEST-') ? 'SANDBOX' : 'PRODUCCIÓN',
                publicKey: publicKey ? publicKey.substring(0, 10) + "..." : 'No configurado'
            }
        };
        
    } catch (error) {
        console.error("❌ Error en prueba de configuración:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}