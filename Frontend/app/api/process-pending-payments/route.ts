import { getPendingPaymentsInfo, processPendingPayments } from '@/lib/mercadopago';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log("🔄 Endpoint de procesamiento de pagos pendientes llamado");
        
        const result = await processPendingPayments();
        
        return NextResponse.json({
            success: true,
            message: "Pagos pendientes procesados",
            result,
        });
        
    } catch (error) {
        console.error("❌ Error procesando pagos pendientes:", error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Error desconocido' 
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        console.log("📊 Consultando información de pagos pendientes");
        
        const info = getPendingPaymentsInfo();
        
        return NextResponse.json({
            success: true,
            message: "Información de pagos pendientes",
            info,
        });
        
    } catch (error) {
        console.error("❌ Error obteniendo información de pagos pendientes:", error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Error desconocido' 
            },
            { status: 500 }
        );
    }
} 