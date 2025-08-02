import { createSingleProductPreference } from '@/lib/mercadopago';
import { getProductById } from '@/lib/products';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { productId, userEmail } = await request.json();

        // Validar que se envió el productId y userEmail
        if (!productId || !userEmail) {
            return NextResponse.json(
                { error: 'Faltan datos requeridos: productId y userEmail' },
                { status: 400 }
            );
        }

        // Obtener el producto
        const product = await getProductById(productId);
        if (!product) {
            return NextResponse.json(
                { error: 'Producto no encontrado' },
                { status: 404 }
            );
        }

        // Generar ID de transacción único
        const transactionId = `${productId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Crear preferencia de MercadoPago
        const preference = await createSingleProductPreference({
            productName: product.name,
            productDescription: product.description,
            productId: product.id,
            productPrice: product.price,
            userEmail,
            transactionId,
        });

        console.log('Preferencia creada exitosamente:', preference.id);

        return NextResponse.json({
            preferenceId: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
            transactionId,
        });

    } catch (error) {
        console.error('Error en checkout:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error interno del servidor' },
            { status: 500 }
        );
    }
}