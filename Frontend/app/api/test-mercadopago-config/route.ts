import { MercadoPagoConfig, Payment } from 'mercadopago';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        console.log('🧪 Probando configuración de MercadoPago...');
        
        const accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            return NextResponse.json({
                success: false,
                error: 'Token de MercadoPago no configurado',
                config: {
                    hasToken: false,
                    tokenLength: 0,
                    environment: 'unknown'
                }
            }, { status: 500 });
        }

        // Verificar formato del token
        const isSandbox = accessToken.startsWith('TEST-');
        const environment = isSandbox ? 'sandbox' : 'production';
        
        console.log(`🔑 Token configurado: ${accessToken.substring(0, 10)}...`);
        console.log(`🌍 Ambiente detectado: ${environment}`);

        // Crear cliente de prueba
        const client = new MercadoPagoConfig({
            accessToken: accessToken,
        });

        // Intentar hacer una llamada de prueba a la API
        try {
            const payment = new Payment(client);
            
            // Intentar obtener un pago de prueba (esto fallará, pero nos dirá si la configuración es correcta)
            await payment.get({ id: 'TEST_PAYMENT_123' });
            
            return NextResponse.json({
                success: false,
                error: 'Configuración correcta pero pago de prueba no existe (esto es normal)',
                config: {
                    hasToken: true,
                    tokenLength: accessToken.length,
                    tokenPreview: `${accessToken.substring(0, 10)}...`,
                    environment: environment,
                    clientConfigured: true,
                    apiAccessible: true
                }
            });

        } catch (apiError: any) {
            // Si el error es 404, significa que la configuración es correcta
            if (apiError.message && apiError.message.includes('404')) {
                return NextResponse.json({
                    success: true,
                    message: 'Configuración de MercadoPago correcta',
                    config: {
                        hasToken: true,
                        tokenLength: accessToken.length,
                        tokenPreview: `${accessToken.substring(0, 10)}...`,
                        environment: environment,
                        clientConfigured: true,
                        apiAccessible: true,
                        errorType: '404_not_found',
                        errorMessage: 'Pago de prueba no existe (normal)'
                    }
                });
            }
            
            // Si es otro error, puede ser de configuración
            return NextResponse.json({
                success: false,
                error: 'Error al conectar con MercadoPago',
                config: {
                    hasToken: true,
                    tokenLength: accessToken.length,
                    tokenPreview: `${accessToken.substring(0, 10)}...`,
                    environment: environment,
                    clientConfigured: true,
                    apiAccessible: false,
                    errorType: 'api_error',
                    errorMessage: apiError.message
                }
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('❌ Error en prueba de configuración:', error);
        
        return NextResponse.json({
            success: false,
            error: 'Error interno del servidor',
            config: {
                hasToken: !!process.env.MP_ACCESS_TOKEN,
                tokenLength: process.env.MP_ACCESS_TOKEN?.length || 0,
                environment: 'unknown',
                clientConfigured: false,
                apiAccessible: false,
                errorType: 'internal_error',
                errorMessage: error.message
            }
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { paymentId } = await request.json();
        
        if (!paymentId) {
            return NextResponse.json({
                success: false,
                error: 'Se requiere paymentId'
            }, { status: 400 });
        }

        console.log(`🧪 Probando obtención de pago: ${paymentId}`);
        
        const accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            return NextResponse.json({
                success: false,
                error: 'Token de MercadoPago no configurado'
            }, { status: 500 });
        }

        const client = new MercadoPagoConfig({
            accessToken: accessToken,
        });

        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: paymentId });

        return NextResponse.json({
            success: true,
            message: 'Pago obtenido exitosamente',
            payment: {
                id: paymentInfo.id,
                status: paymentInfo.status,
                amount: paymentInfo.transaction_amount,
                method: paymentInfo.payment_method?.type,
                externalReference: paymentInfo.external_reference,
                dateCreated: paymentInfo.date_created
            }
        });

    } catch (error: any) {
        console.error('❌ Error al probar pago:', error);
        
        return NextResponse.json({
            success: false,
            error: 'Error al obtener pago',
            details: {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            }
        }, { status: 500 });
    }
} 