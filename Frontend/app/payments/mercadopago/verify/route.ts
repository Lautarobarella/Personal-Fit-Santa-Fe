import { processWebhookNotification, type WebhookPayload } from '@/lib/mercadopago';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, externalReference } = await request.json();

    if (!paymentId && !externalReference) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros: paymentId o externalReference' },
        { status: 400 }
      );
    }

    // Preferimos paymentId si está disponible
    const payload: WebhookPayload = paymentId
      ? { type: 'payment', data: { id: String(paymentId) } }
      : { type: 'payment', data: { id: String(externalReference) } };

    const result = await processWebhookNotification(payload);

    return NextResponse.json(result, { status: 200 });
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


