import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        console.log('🏥 === ENDPOINT DE SALUD ===');
        
        // Verificar variables de entorno críticas
        const envCheck = {
            MP_ACCESS_TOKEN: !!process.env.MP_ACCESS_TOKEN,
            NEXT_PUBLIC_BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
            NEXT_PUBLIC_FRONTEND_URL: !!process.env.NEXT_PUBLIC_FRONTEND_URL,
            NODE_ENV: process.env.NODE_ENV || 'development'
        };
        
        // Verificar que todas las variables críticas estén configuradas
        const allEnvVarsConfigured = Object.values(envCheck).every(Boolean);
        
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            environmentVariables: envCheck,
            allVariablesConfigured: allEnvVarsConfigured,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version
        };
        
        console.log('✅ Estado de salud:', healthStatus);
        
        return NextResponse.json(healthStatus);
        
    } catch (error) {
        console.error('❌ Error en endpoint de salud:', error);
        
        return NextResponse.json(
            { 
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Error desconocido',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
} 