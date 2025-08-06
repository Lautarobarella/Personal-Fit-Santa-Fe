import { processWebhookNotification, type WebhookPayload } from '@/lib/mercadopago';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const responsePromise = NextResponse.json({ 
            success: true, 
            message: 'Webhook recibido correctamente',
            timestamp: new Date().toISOString()
        });

        processWebhookAsync(request).catch(() => {
            // Error handling without logging
        });

        return responsePromise;

    } catch (error) {
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

async function processWebhookAsync(request: NextRequest) {
    try {
        const payload: WebhookPayload = await request.json();
        await processWebhookNotification(payload);
    } catch (error) {
        // Error handling without logging
    }
}

// Método GET para verificar que el webhook está funcionando
export async function GET() {
    return NextResponse.json({ 
        success: true,
        message: 'Webhook de MercadoPago funcionando correctamente',
        timestamp: new Date().toISOString(),
        endpoints: {
            webhook: '/api/webhook/mercadopago',
            test: '/api/webhook/test',
            health: '/api/health',
            config: '/api/test-mercadopago-config'
        }
    });
}