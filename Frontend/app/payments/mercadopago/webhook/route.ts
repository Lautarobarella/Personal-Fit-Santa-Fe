import { processWebhookNotification, type WebhookPayload } from '@/lib/mercadopago';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1) Validación del webhook con la clave enviada por MercadoPago
    const signature = request.headers.get('x-signature') || request.headers.get('X-Signature');
    const expectedSecret = process.env.WEBHOOK_SECRET;

    console.log('signature DESDE WEBHOOK', signature);
    console.log('expectedSecret DESDE GITHUB SECRETS', expectedSecret);

    if (!expectedSecret) {
      // Configuración faltante del entorno: WEBHOOK_SECRET no definido
      return NextResponse.json(
        {
          success: false,
          error: 'WEBHOOK_SECRET no configurado en el entorno',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    if (!signature || signature !== expectedSecret) {
      // Firma inválida o ausente: rechazar la petición
      return NextResponse.json(
        {
          success: false,
          error: 'Firma inválida',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // 2) Procesar la notificación en background para responder rápido
    const responsePromise = NextResponse.json({
      success: true,
      message: 'Webhook recibido correctamente',
      timestamp: new Date().toISOString(),
    });

    processWebhookAsync(request).catch((err) => {
      console.error('Error procesando webhook async:', err instanceof Error ? err.message : err);
    });

    return responsePromise;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString(),
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
            webhook: '/payments/mercadopago/webhook',
            checkout: '/payments/mercadopago/checkout'
        }
    });
}
