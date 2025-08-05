import { createSingleProductPreference } from '@/lib/mercadopago';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('=== INICIO DE CHECKOUT ===');
        
        const { productId, productName, productPrice, userEmail, userDni } = await request.json();
        console.log('Datos recibidos:', { productId, productName, productPrice, userEmail, userDni });

        // Validar que se envió el productId, productName, productPrice, userEmail y userDni
        if (!productId || !productName || !productPrice || !userEmail || !userDni) {
            console.error('Datos faltantes:', { productId, productName, productPrice, userEmail, userDni });
            return NextResponse.json(
                { error: 'Faltan datos requeridos: productId, productName, productPrice, userEmail y userDni' },
                { status: 400 }
            );
        }

        // Verificar variables de entorno
        const mpToken = process.env.MP_ACCESS_TOKEN;

        if (!mpToken) {
            console.error('Token de MercadoPago no configurado');
            return NextResponse.json(
                { error: 'Configuración de MercadoPago incompleta' },
                { status: 500 }
            );
        }

        // Usar los datos del producto que ya fueron enviados desde el frontend
        console.log('Usando datos del producto enviados desde el frontend:');
        console.log('- ID:', productId);
        console.log('- Nombre:', productName);
        console.log('- Precio:', productPrice);

        // Generar ID de transacción único incluyendo el DNI del usuario
        const transactionId = `${userDni}-${productId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        console.log('Transaction ID generado:', transactionId);

        // Crear preferencia de MercadoPago
        console.log('Creando preferencia de MercadoPago...');
        const preference = await createSingleProductPreference({
            productName: productName,
            productDescription: 'Cuota mensual gimnasio Personal Fit',
            productId: productId,
            productPrice: productPrice,
            userEmail,
            userDni,
            transactionId,
        });

        console.log('Preferencia creada exitosamente:', {
            id: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point
        });

        // NO crear pago pendiente aquí - solo crear la preferencia
        // El pago se creará automáticamente cuando llegue el webhook de Mercado Pago
        console.log('Preferencia creada - esperando pago de Mercado Pago...');

        return NextResponse.json({
            preferenceId: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
            transactionId,
        });

    } catch (error) {
        console.error('=== ERROR EN CHECKOUT ===');
        console.error('Error completo:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        
        // Determinar el tipo de error
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