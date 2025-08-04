import { testMercadoPagoConfiguration } from "@/lib/mercadopago";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        console.log("🧪 Iniciando prueba de configuración de Mercado Pago...");
        
        const result = await testMercadoPagoConfiguration();
        
        if (result.success) {
            return NextResponse.json({
                success: true,
                message: "Configuración de Mercado Pago verificada exitosamente",
                data: result
            });
        } else {
            return NextResponse.json({
                success: false,
                message: "Error en la configuración de Mercado Pago",
                error: result.error
            }, { status: 500 });
        }
        
    } catch (error) {
        console.error("❌ Error en endpoint de prueba:", error);
        return NextResponse.json({
            success: false,
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : "Error desconocido"
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { productName, productPrice } = body;
        
        console.log("🧪 Creando preferencia de prueba con datos personalizados...");
        
        const result = await testMercadoPagoConfiguration();
        
        if (result.success) {
            return NextResponse.json({
                success: true,
                message: "Preferencia de prueba creada exitosamente",
                data: result
            });
        } else {
            return NextResponse.json({
                success: false,
                message: "Error al crear preferencia de prueba",
                error: result.error
            }, { status: 500 });
        }
        
    } catch (error) {
        console.error("❌ Error en endpoint POST:", error);
        return NextResponse.json({
            success: false,
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : "Error desconocido"
        }, { status: 500 });
    }
} 