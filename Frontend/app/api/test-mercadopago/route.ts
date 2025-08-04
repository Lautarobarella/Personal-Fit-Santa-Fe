import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const mpToken = process.env.MP_ACCESS_TOKEN;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const environment = process.env.NEXT_PUBLIC_MP_ENVIRONMENT;
        
        return NextResponse.json({
            success: true,
            config: {
                hasMpToken: !!mpToken,
                mpTokenLength: mpToken?.length || 0,
                mpTokenPreview: mpToken ? `${mpToken.substring(0, 10)}...` : 'No configurado',
                baseUrl,
                environment,
                nodeEnv: process.env.NODE_ENV
            },
            message: 'Configuración de MercadoPago verificada'
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
} 