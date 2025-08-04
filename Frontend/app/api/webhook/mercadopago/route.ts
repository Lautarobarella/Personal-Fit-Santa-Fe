import { processWebhookNotification, type WebhookPayload } from '@/lib/mercadopago';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('=== WEBHOOK MERCADOPAGO RECIBIDO ===');
        console.log('Timestamp:', new Date().toISOString());

        // Responder inmediatamente para evitar timeout
        const responsePromise = NextResponse.json({ 
            success: true, 
            message: 'Webhook recibido correctamente',
            timestamp: new Date().toISOString()
        });

        // Procesar el webhook de forma asíncrona
        processWebhookAsync(request).catch(error => {
            console.error('Error en procesamiento asíncrono del webhook:', error);
        });

        // Retornar respuesta inmediata
        return responsePromise;

    } catch (error) {
        console.error('❌ Error en webhook:', error);
        
        // Aún así responder para evitar timeout
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Error desconocido',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

// Función asíncrona para procesar el webhook sin bloquear la respuesta
async function processWebhookAsync(request: NextRequest) {
    try {
        console.log('🔄 Iniciando procesamiento asíncrono del webhook...');
        
        const payload: WebhookPayload = await request.json();
        console.log('📦 Payload recibido:', JSON.stringify(payload, null, 2));

        // Procesar la notificación
        const result = await processWebhookNotification(payload);
        console.log('✅ Resultado del procesamiento:', result);

        // Aquí puedes agregar lógica adicional como:
        // - Actualizar base de datos local
        // - Enviar notificaciones al usuario
        // - Registrar el pago en tu sistema
        
        console.log('🎉 Webhook procesado exitosamente');

    } catch (error) {
        console.error('❌ Error en procesamiento asíncrono:', error);
        // No relanzar el error para no afectar la respuesta
    }
}

// Método GET para verificar que el webhook está funcionando
export async function GET() {
    console.log('🔍 Verificación de webhook solicitada');
    
    return NextResponse.json({ 
        success: true,
        message: 'Webhook de MercadoPago funcionando correctamente',
        timestamp: new Date().toISOString(),
        endpoints: {
            webhook: '/api/webhook/mercadopago',
            pending: '/api/process-pending-payments'
        }
    });
}