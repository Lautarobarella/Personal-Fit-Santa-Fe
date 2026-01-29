import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextRequest, NextResponse } from 'next/server';

/**
 * MercadoPago Checkout API Route
 * 
 * Handles the server-side generation of Payment Preferences.
 * A "Preference" contains all the details of the transaction (items, payer, back URLs)
 * and is required to initialize the MercadoPago Checkout Pro widget or redirect.
 */

// Initialize the MP SDK with the Access Token from environment variables.
// This runs only on the server, keeping the token secure.
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
    options: {
        timeout: 5000,
        idempotencyKey: 'abc' // Unique key to prevent duplicates
    }
});

// Preference resource manager
const pref = new Preference(client);

/**
 * Helper: Determine Base URL
 * Dynamically resolves the domain for constructing callback URLs (Success, Failure, Pending).
 * Falls back to production domain if not explicitly set in env (e.g., localhost).
 */
const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_BASE_URL) {
        return process.env.NEXT_PUBLIC_BASE_URL;
    }
    return 'https://personalfitsantafe.com';
};

/**
 * POST Handler
 * 
 * Receives product and user details and returns a preference ID.
 * 
 * @param request JSON body { productId, productName, productPrice, userEmail, userDni }
 * @returns JSON { preferenceId, initPoint }
 */
export async function POST(request: NextRequest) {
    try {
        const { productId, productName, productPrice, userEmail, userDni } = await request.json();

        // 1. Validation: Ensure all critical fields are present
        if (!productId || !productName || !productPrice || !userEmail || !userDni) {
            return NextResponse.json(
                { error: 'Faltan datos requeridos: productId, productName, productPrice, userEmail y userDni' },
                { status: 400 }
            );
        }

        // 2. Safety Check: Verify SDK is properly configured
        const mpToken = process.env.MP_ACCESS_TOKEN;

        if (!mpToken) {
            return NextResponse.json(
                { error: 'Configuración de MercadoPago incompleta' },
                { status: 500 }
            );
        }

        // 3. Transaction ID Generation
        // Creates a unique reference string to track this payment in our database and link it to MP webhooks.
        // Format: DNI-Product-Timestamp-RandomSuffix
        const transactionId = `${userDni}-${productId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const baseUrl = getBaseUrl();

        // 4. Construct Preference Body
        // Defines *what* is being bought and *where* to send the user after payment.
        const preferenceBody = {
            items: [
                {
                    id: productId,
                    title: productName,
                    description: 'Cuota mensual gimnasio Personal Fit',
                    quantity: 1,
                    currency_id: "ARS",
                    unit_price: productPrice,
                },
            ],
            // Redirect URLs for the user flow
            back_urls: {
                success: `${baseUrl}/payments/result/success`,
                failure: `${baseUrl}/payments/result/failure`,
                pending: `${baseUrl}/payments/result/pending`,
            },
            // Webhook URL for server-to-server status updates
            notification_url: `${baseUrl}/payments/mercadopago/webhook`,
            external_reference: transactionId,
            // Configuration: Restrict payment methods to Instant only (exclude printed tickets like RapiPago)
            // This ensures the membership is activated immediately.
            payment_methods: {
                excluded_payment_methods: [
                    { id: "rapipago" },
                    { id: "pagofacil" }
                ],
                excluded_payment_types: [
                    { id: "ticket" },
                    { id: "atm" }
                ],
                installments: 1
            }
        };

        // 5. Create Preference in MercadoPago API
        const preference = await pref.create({ body: preferenceBody });

        // 6. Return the init point (URL) and ID to the frontend
        return NextResponse.json({
            preferenceId: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
            transactionId,
        });

    } catch (error) {
        // Detailed error handling for different failure scenarios (Auth, Validation, Network)
        let errorMessage = 'Error interno del servidor';
        let statusCode = 500;

        if (error instanceof Error) {
            if (error.message.includes('401')) {
                errorMessage = 'Token de MercadoPago inválido';
                statusCode = 401;
            } else if (error.message.includes('400')) {
                errorMessage = 'Datos de pago inválidos';
                statusCode = 400;
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Error de conexión con MercadoPago';
                statusCode = 503;
            } else {
                errorMessage = error.message;
            }
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        );
    }
}
