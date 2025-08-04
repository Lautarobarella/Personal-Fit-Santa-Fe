import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('🧪 Endpoint de prueba de webhook llamado');
        
        // Simular un payload de MercadoPago
        const testPayload = {
            action: "payment.created",
            api_version: "v1",
            data: {
                id: "TEST_PAYMENT_ID"
            },
            date_created: new Date().toISOString(),
            id: 123456789,
            live_mode: false,
            type: "payment",
            user_id: "TEST_USER_ID"
        };

        console.log('📦 Payload de prueba:', JSON.stringify(testPayload, null, 2));

        // Responder inmediatamente
        return NextResponse.json({
            success: true,
            message: 'Webhook de prueba funcionando correctamente',
            payload: testPayload,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error en webhook de prueba:', error);
        
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

export async function GET() {
    console.log('🔍 Verificación de webhook de prueba solicitada');
    
    return NextResponse.json({
        success: true,
        message: 'Webhook de prueba funcionando correctamente',
        timestamp: new Date().toISOString(),
        instructions: {
            test_post: 'POST /api/webhook/test - Para probar el webhook',
            test_get: 'GET /api/webhook/test - Para verificar que responde',
            real_webhook: 'POST /api/webhook/mercadopago - Webhook real de MercadoPago'
        }
    });
} 