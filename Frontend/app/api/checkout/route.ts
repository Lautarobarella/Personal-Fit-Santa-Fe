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
        const { productId, productName, productPrice, userEmail, userDni } = await request.json();

        if (!productId || !productName || !productPrice || !userEmail || !userDni) {
            return NextResponse.json(
                { error: 'Faltan datos requeridos: productId, productName, productPrice, userEmail y userDni' },
                { status: 400 }
            );
        }

        if (!process.env.MP_ACCESS_TOKEN) {
            return NextResponse.json(
                { error: 'Configuración de MercadoPago incompleta' },
                { status: 500 }
            );
        }

        const transactionId = `${userDni}-${productId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const baseUrl = getBaseUrl();

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
            notification_url: `${baseUrl}/api/webhook/mercadopago`,
            external_reference: transactionId,
        };

        const preference = await pref.create({ body: preferenceBody });

        return NextResponse.json({
            preferenceId: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
            transactionId,
        });

    } catch (error) {
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