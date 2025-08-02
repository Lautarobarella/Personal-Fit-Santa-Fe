import {
    MercadoPagoConfig,
    MerchantOrder,
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
        idempotencyKey: "abc"
    },
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
        console.log(`Creando preferencia para producto: ${options.productName}`);

        // URL base por defecto si no está configurada
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const preference = await pref.create({
            body: {
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

                // Información del pagador (datos de ejemplo)
                payer: {
                    name: "Usuario",
                    surname: "Ejemplo",
                    email: options.userEmail,
                    phone: {
                        area_code: "11",
                        number: "12345678"
                    },
                    identification: {
                        type: "DNI",
                        number: "12345678"
                    },
                    address: {
                        zip_code: "1234",
                        street_name: "Calle Ejemplo",
                        street_number: "123"
                    },
                    date_created: new Date().toISOString()
                },

                // URLs de redirección después del pago
                back_urls: {
                    success: `${baseUrl}/success`,
                    failure: `${baseUrl}/failure`,
                    pending: `${baseUrl}/pending`,
                },

                // URL del webhook para recibir notificaciones
                notification_url: `${baseUrl}/api/webhook/mercadopago`,

                // Referencia externa para vincular con la compra
                external_reference: options.transactionId,

                // Configuraciones adicionales
                expires: true,
                expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos

                // Configuración de métodos de pago - HABILITAR TODOS LOS MÉTODOS
                payment_methods: {
                    // NO excluir ningún tipo de pago
                    excluded_payment_types: [],
                    // NO excluir ningún método de pago específico
                    excluded_payment_methods: [],
                    // Configurar cuotas para tarjetas de crédito
                    installments: 12,
                    // Cuotas por defecto
                    default_installments: 1,
                },

                // Configuración de envíos (no aplica para servicios digitales)
                shipments: {
                    mode: "not_specified"
                },

                // Configuración adicional para habilitar todos los métodos
                binary_mode: false,
                statement_descriptor: "Personal Fit",
            },
        });

        console.log(`Preferencia creada exitosamente: ${preference.id}`);
        console.log(`URLs de redirección configuradas:`, {
            success: `${baseUrl}/success`,
            failure: `${baseUrl}/failure`,
            pending: `${baseUrl}/pending`,
        });

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
        console.log(`Obteniendo información del pago: ${id}`);

        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id });

        console.log(`Pago obtenido: ${paymentInfo.id} - Estado: ${paymentInfo.status}`);
        return paymentInfo;

    } catch (error) {
        console.error("Error al obtener pago:", error);
        throw new Error(`Error al obtener información del pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
        console.log("Procesando notificación del webhook:", payload);

        if (payload.type === "payment") {
            const mpPayment = await getPaymentById(payload.data.id);

            console.log(`Pago procesado: ${mpPayment.id} - Estado: ${mpPayment.status}`);

            return {
                paymentId: mpPayment.id,
                status: mpPayment.status,
                externalReference: mpPayment.external_reference,
                amount: mpPayment.transaction_amount,
                paymentMethod: mpPayment.payment_method?.type,
                paymentMethodId: mpPayment.payment_method_id,
                installments: mpPayment.installments,
                processedAt: new Date().toISOString(),
            };
        }

        return { message: "Tipo de notificación no procesado", type: payload.type };

    } catch (error) {
        console.error("Error al procesar webhook:", error);
        throw new Error(`Error al procesar notificación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
} 