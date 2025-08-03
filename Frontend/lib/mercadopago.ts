import {
    MercadoPagoConfig,
    MerchantOrder,
    Payment,
    Preference
} from "mercadopago";
import { createPayment } from "../api/payment/paymentsApi";
import { getProductById } from "./products";

/**
 * Configuración del cliente de MercadoPago
 * Se inicializa con el token de acceso desde las variables de entorno
 */
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
});

// Instancia de Preference para crear preferencias de pago
const pref = new Preference(client);

/**
 * Tipos de datos para crear preferencias de pago
 */
type CreatePrefOptions = {
    productName: string;
    productDescription: string;
    productId: string;
    productPrice: number;
    userEmail: string;
    transactionId: string;
};

/**
 * Crea una preferencia de pago para un producto individual
 * Esta función configura la preferencia que redirigirá al usuario a MercadoPago
 * 
 * @param options - Opciones para crear la preferencia
 * @returns Promise<any> Preferencia creada por MercadoPago
 */
export async function createSingleProductPreference(
    options: CreatePrefOptions
) {
    try {
        console.log(`=== CREANDO PREFERENCIA MERCADOPAGO ===`);
        console.log(`Producto: ${options.productName}`);
        console.log(`Precio: $${options.productPrice}`);
        console.log(`Email: ${options.userEmail}`);

        // Verificar configuración
        const accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            throw new Error('Token de acceso de MercadoPago no configurado');
        }

        console.log(`Token configurado: ${accessToken.substring(0, 10)}...`);
        console.log(`Ambiente: ${accessToken.startsWith('TEST-') ? 'SANDBOX' : 'PRODUCCIÓN'}`);

        // URL base por defecto si no está configurada
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000';
        console.log(`URL base configurada: ${baseUrl}`);

        // Usar datos de prueba diferentes para evitar el error "pagar a uno mismo"
        const testEmail = process.env.NEXT_PUBLIC_MP_TEST_EMAIL || 'test-buyer@example.com';
        const testPhone = process.env.NEXT_PUBLIC_MP_TEST_PHONE || '12345678';
        const testDni = process.env.NEXT_PUBLIC_MP_TEST_DNI || '12345678';

        const preferenceBody = {
            // Configuración del producto
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

            // Información del pagador (datos de prueba diferentes)
            payer: {
                name: "Comprador",
                surname: "Prueba",
                email: testEmail, // Usar email de prueba en lugar del email real
                phone: {
                    area_code: "11",
                    number: testPhone
                },
                identification: {
                    type: "DNI",
                    number: testDni
                },
                address: {
                    zip_code: "1234",
                    street_name: "Calle de Prueba",
                    street_number: "123"
                },
                date_created: new Date().toISOString()
            },

            // URLs de redirección después del pago (usar HTTPS)
            back_urls: {
                success: `${baseUrl}/success`,
                failure: `${baseUrl}/failure`,
                pending: `${baseUrl}/pending`,
            },

            // URL del webhook para recibir notificaciones (usar HTTPS)
            notification_url: `${baseUrl}/api/webhook/mercadopago`,

            // ID de referencia externa para identificar el pago
            external_reference: options.transactionId,

            // Configuración adicional
            expires: true,
            expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
            statement_descriptor: "Personal Fit",
        };

        console.log("Cuerpo de la preferencia preparado, enviando a MercadoPago...");
        console.log("URLs configuradas:", {
            success: `${baseUrl}/success`,
            failure: `${baseUrl}/failure`,
            pending: `${baseUrl}/pending`,
            webhook: `${baseUrl}/api/webhook/mercadopago`
        });
        console.log("Datos del pagador:", {
            email: testEmail,
            phone: testPhone,
            dni: testDni
        });

        const preference = await pref.create({ body: preferenceBody });

        console.log("=== PREFERENCIA CREADA EXITOSAMENTE ===");
        console.log(`ID: ${preference.id}`);
        console.log(`Init Point: ${preference.init_point}`);
        console.log(`Sandbox Init Point: ${preference.sandbox_init_point}`);

        return preference;

    } catch (error) {
        console.error("Error al crear preferencia:", error);
        throw new Error(`Error al crear preferencia de pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
}

/**
 * Obtiene información de un pago por su ID
 * 
 * @param id - ID del pago de MercadoPago
 * @returns Promise<any> Información del pago
 */
export async function getPaymentById(id: string) {
    try {
        console.log(`🔍 Obteniendo información del pago: ${id}`);
        
        // Verificar configuración
        const accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            throw new Error('Token de acceso de MercadoPago no configurado');
        }
        
        console.log(`🔑 Token: ${accessToken.substring(0, 10)}...`);
        console.log(`🌍 Ambiente: ${accessToken.startsWith('TEST-') ? 'SANDBOX' : 'PRODUCCIÓN'}`);

        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id });

        console.log(`✅ Pago obtenido exitosamente:`);
        console.log(`   - ID: ${paymentInfo.id}`);
        console.log(`   - Estado: ${paymentInfo.status}`);
        console.log(`   - Monto: $${paymentInfo.transaction_amount}`);
        console.log(`   - Método: ${paymentInfo.payment_method?.type || 'N/A'}`);
        console.log(`   - Referencia: ${paymentInfo.external_reference || 'N/A'}`);
        
        return paymentInfo;

    } catch (error: any) {
        console.error("❌ Error al obtener pago:", error);
        
        // Mostrar información detallada del error
        if (error.response) {
            console.error("📊 Detalles del error:");
            console.error(`   - Status: ${error.response.status}`);
            console.error(`   - StatusText: ${error.response.statusText}`);
            console.error(`   - Data:`, error.response.data);
        }
        
        // Determinar el tipo de error específico
        let errorMessage = 'Error desconocido';
        if (error.message) {
            if (error.message.includes('404') || error.message.includes('not_found')) {
                errorMessage = 'Pago no encontrado - puede estar en procesamiento';
            } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                errorMessage = 'Token de MercadoPago inválido';
            } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                errorMessage = 'Sin permisos para acceder al pago';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Error de conexión con MercadoPago';
            } else {
                errorMessage = error.message;
            }
        }
        
        throw new Error(`Error al obtener información del pago: ${errorMessage}`);
    }
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
    action: string;
    api_version: string;
    data: {
        id: string;
    };
    date_created: string;
    id: number;
    live_mode: boolean;
    type: string;
    user_id: string;
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

        if (payload.type === "payment") {
            // Intentar obtener información del pago con reintentos
            let mpPayment = null;
            let retryCount = 0;
            const maxRetries = 3;
            const retryDelay = 2000; // 2 segundos

            while (retryCount < maxRetries) {
                try {
                    console.log(`Intento ${retryCount + 1} de ${maxRetries} para obtener pago ${payload.data.id}`);
                    mpPayment = await getPaymentById(payload.data.id);
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

        if (payload.type === "merchant_order") {
            console.log("📦 Orden de comerciante recibida, procesando...");
            return {
                success: true,
                type: "merchant_order",
                orderId: payload.data.id,
                processedAt: new Date().toISOString(),
            };
        }

        return { 
            success: false,
            message: "Tipo de notificación no procesado", 
            type: payload.type 
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
        const externalRef = payload.data.id; // Usar el ID del pago como referencia temporal
        
        const pendingPayment = {
            mpPaymentId: payload.data.id,
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
        pendingPayments.set(payload.data.id, pendingPayment);
        console.log(`💾 Pago pendiente guardado. Total pendientes: ${pendingPayments.size}`);
        
        return {
            success: true,
            type: "pending_payment",
            paymentId: payload.data.id,
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
            await simulatePaymentCreation(paymentInfo);
            
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
async function simulatePaymentCreation(paymentInfo: any) {
    try {
        console.log("🏗️ Creando pago real en el sistema...");
        
        // Usar el DNI que viene en paymentInfo (obtenido del usuario actual)
        const clientDni = paymentInfo.clientDni || 1234;
        
        const paymentData = {
            clientDni: clientDni,
            amount: paymentInfo.amount,
            createdAt: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días
            paymentStatus: mapMercadoPagoStatus(paymentInfo.status) as "pending" | "paid",
        };
        
        console.log("📋 Datos del pago a crear:", paymentData);
        console.log("🌐 Llamando a la API de pagos del backend...");
        
        // Crear el pago real usando la API del backend
        const response = await createPayment(paymentData);
        
        console.log("✅ Pago creado exitosamente en el sistema");
        console.log("📊 Resumen del pago:");
        console.log(`   - Cliente DNI: ${paymentData.clientDni}`);
        console.log(`   - Producto: ${paymentInfo.productName}`);
        console.log(`   - Monto: $${paymentData.amount}`);
        console.log(`   - Estado: ${paymentData.paymentStatus}`);
        console.log(`   - Método: ${mapPaymentMethod(paymentInfo.paymentMethod)}`);
        console.log(`   - ID MP: ${paymentInfo.mpPaymentId}`);
        console.log(`   - Respuesta del backend:`, response);
        
        return response;
        
    } catch (error) {
        console.error("❌ Error creando pago en el sistema:", error);
        throw error;
    }
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