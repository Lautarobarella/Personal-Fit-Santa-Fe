import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextRequest, NextResponse } from 'next/server';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
    options: {
        timeout: 5000,
        idempotencyKey: 'abc'
    }
});

const pref = new Preference(client);

const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_BASE_URL) {
        return process.env.NEXT_PUBLIC_BASE_URL;
    }
    return 'https://personalfitsantafe.com';
};

export async function POST(request: NextRequest) {
    try {
        console.log('=== CHECKOUT API CALL ===');
        const { productId, productName, productPrice, userEmail, userDni } = await request.json();
        console.log('Datos recibidos:', { productId, productName, productPrice, userEmail, userDni });

        if (!productId || !productName || !productPrice || !userEmail || !userDni) {
            console.log('Faltan datos requeridos');
            return NextResponse.json(
                { error: 'Faltan datos requeridos: productId, productName, productPrice, userEmail y userDni' },
                { status: 400 }
            );
        }

        const mpToken = process.env.MP_ACCESS_TOKEN;
        console.log('MP Token configurado:', mpToken ? 'SI' : 'NO');
        
        if (!mpToken) {
            console.log('Error: Token de MercadoPago no configurado');
            return NextResponse.json(
                { error: 'Configuración de MercadoPago incompleta' },
                { status: 500 }
            );
        }

        const transactionId = `${userDni}-${productId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const baseUrl = getBaseUrl();
        
        console.log('Transaction ID:', transactionId);
        console.log('Base URL:', baseUrl);

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
            back_urls: {
                success: `${baseUrl}/payments/result/success`,
                failure: `${baseUrl}/payments/result/failure`,
                pending: `${baseUrl}/payments/result/pending`,
            },
            notification_url: `${baseUrl}/payments/mercadopago/webhook`,
            external_reference: transactionId,
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

        console.log('Preference body:', JSON.stringify(preferenceBody, null, 2));
        
        console.log('Creando preferencia...');
        const preference = await pref.create({ body: preferenceBody });
        
        console.log('Preferencia creada:', {
            id: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point
        });

        return NextResponse.json({
            preferenceId: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
            transactionId,
        });

    } catch (error) {
        console.error('Error completo en checkout:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
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
