import { testMercadoPagoConfiguration } from '@/lib/mercadopago';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        console.log('🧪 === PRUEBA DE CONFIGURACIÓN MERCADOPAGO ===');
        
        const result = await testMercadoPagoConfiguration();
        
        return NextResponse.json(result);
        
    } catch (error) {
        console.error('❌ Error en prueba de configuración:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Error desconocido' 
            },
            { status: 500 }
        );
    }
} 