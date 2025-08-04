import { NextRequest, NextResponse } from 'next/server';

// Configuración central para las URLs de la API (misma lógica que config.ts)
const getApiBaseUrl = () => {
  // Usar variable de entorno si está disponible
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // En desarrollo (fuera de Docker), usar localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8080';
  }
  
  // Si estamos en el servidor de producción (72.60.1.76), usar la IP del servidor
  if (typeof window !== 'undefined' && window.location.hostname === '72.60.1.76') {
    return 'http://72.60.1.76:8080';
  }
  
  // En Docker, usar el nombre del servicio
  return 'http://personalfit-backend:8080';
};

export async function GET(request: NextRequest) {
    try {
        const mpToken = process.env.MP_ACCESS_TOKEN;
        const baseUrl = getApiBaseUrl();
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