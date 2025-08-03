import { createSingleProductPreference } from '@/lib/mercadopago';
import { getProductById } from '@/lib/products';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('=== INICIO DE CHECKOUT ===');
        
        const { productId, userEmail, userDni } = await request.json();
        console.log('Datos recibidos:', { productId, userEmail, userDni });

        // Validar que se envió el productId, userEmail y userDni
        if (!productId || !userEmail || !userDni) {
            console.error('Datos faltantes:', { productId, userEmail, userDni });
            return NextResponse.json(
                { error: 'Faltan datos requeridos: productId, userEmail y userDni' },
                { status: 400 }
            );
        }

        // Verificar variables de entorno
        const mpToken = process.env.MP_ACCESS_TOKEN;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        console.log('Variables de entorno:', {
            hasMpToken: !!mpToken,
            mpTokenLength: mpToken?.length,
            baseUrl,
            nodeEnv: process.env.NODE_ENV
        });

        if (!mpToken) {
            console.error('Token de MercadoPago no configurado');
            return NextResponse.json(
                { error: 'Configuración de MercadoPago incompleta' },
                { status: 500 }
            );
        }

        // Obtener el producto
        console.log('Buscando producto con ID:', productId);
        const product = await getProductById(productId);
        if (!product) {
            console.error('Producto no encontrado:', productId);
            return NextResponse.json(
                { error: 'Producto no encontrado' },
                { status: 404 }
            );
        }
        console.log('Producto encontrado:', product);

        // Generar ID de transacción único incluyendo el DNI del usuario
        const transactionId = `${userDni}-${productId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        console.log('Transaction ID generado:', transactionId);

        // Crear preferencia de MercadoPago
        console.log('Creando preferencia de MercadoPago...');
        const preference = await createSingleProductPreference({
            productName: product.name,
            productDescription: product.description,
            productId: product.id,
            productPrice: product.price,
            userEmail,
            userDni,
            transactionId,
        });

        console.log('Preferencia creada exitosamente:', {
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