import { processWebhookNotification, type WebhookPayload } from '@/lib/mercadopago';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('Webhook de MercadoPago recibido');

        const payload: WebhookPayload = await request.json();
        
        console.log('Payload del webhook:', JSON.stringify(payload, null, 2));

        // Procesar la notificación
        const result = await processWebhookNotification(payload);

        console.log('Resultado del procesamiento:', result);

        // Aquí puedes agregar lógica adicional como:
        // - Actualizar base de datos local
        // - Enviar notificaciones al usuario
        // - Registrar el pago en tu sistema
        
        return NextResponse.json({ 
            success: true, 
            result,
            message: 'Webhook procesado exitosamente' 
        });

    } catch (error) {
        console.error('Error procesando webhook:', error);
        
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Error desconocido' 
            },
            { status: 500 }
        );
    }
}

// Método GET para verificar que el webhook está funcionando
export async function GET() {
    return NextResponse.json({ 
        message: 'Webhook de MercadoPago funcionando',
        timestamp: new Date().toISOString()
    });
}