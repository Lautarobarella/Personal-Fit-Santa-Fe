import { NextRequest, NextResponse } from 'next/server';

// Almacenamiento temporal para webhooks de prueba
const testWebhooks: any[] = [];

export async function POST(request: NextRequest) {
    try {
        console.log('=== WEBHOOK DE PRUEBA RECIBIDO ===');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Headers:', Object.fromEntries(request.headers.entries()));

        const payload = await request.json();
        console.log('Payload completo:', JSON.stringify(payload, null, 2));

        // Guardar el webhook para inspección posterior
        const webhookRecord = {
            timestamp: new Date().toISOString(),
            headers: Object.fromEntries(request.headers.entries()),
            payload: payload,
            type: payload.type || payload.topic,
            action: payload.action,
            resourceId: payload.data?.id || payload.resource
        };

        testWebhooks.push(webhookRecord);
        
        // Mantener solo los últimos 10 webhooks
        if (testWebhooks.length > 10) {
            testWebhooks.shift();
        }

        console.log('📋 Webhook guardado. Total webhooks de prueba:', testWebhooks.length);

        return NextResponse.json({ 
            success: true, 
            message: 'Webhook de prueba recibido correctamente',
            timestamp: new Date().toISOString(),
            webhookType: webhookRecord.type,
            totalWebhooks: testWebhooks.length
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
    console.log('🔍 Consultando webhooks de prueba');
    
    return NextResponse.json({ 
        success: true,
        message: 'Webhooks de prueba registrados',
        timestamp: new Date().toISOString(),
        totalWebhooks: testWebhooks.length,
        webhooks: testWebhooks.map((webhook, index) => ({
            index: index + 1,
            timestamp: webhook.timestamp,
            type: webhook.type,
            action: webhook.action,
            resourceId: webhook.resourceId,
            payload: webhook.payload
        }))
    });
} 