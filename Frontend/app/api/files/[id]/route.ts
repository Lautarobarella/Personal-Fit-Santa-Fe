import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;
    
    // Obtener el token de autorización del header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Hacer la petición al backend con el token
    // Usar la URL del backend directamente, no la del frontend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.1.76:8080';
    const response = await fetch(`${backendUrl}/api/files/${fileId}`, {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Backend error response: ${errorText}`);
      
      return NextResponse.json(
        { error: 'File not found or access denied', details: errorText },
        { status: response.status }
      );
    }

    // Obtener el contenido del archivo
    const fileBuffer = await response.arrayBuffer();
    
    // Obtener los headers de la respuesta del backend
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');

    // Crear la respuesta con los headers apropiados
    const headers = new Headers();
    if (contentType) headers.set('content-type', contentType);
    if (contentDisposition) headers.set('content-disposition', contentDisposition);
    headers.set('cache-control', 'public, max-age=3600'); // Cache por 1 hora

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 