import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const fileId = resolvedParams.id;

        // Server-side route handler: prefer internal Docker URL.
        const backendUrl =
            process.env.BACKEND_INTERNAL_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            process.env.NEXT_PUBLIC_API_BASE_URL ||
            'http://localhost:8080';

        const response = await fetch(`${backendUrl}/api/payments/files/${fileId}`);

        if (!response.ok) {
            console.error(`Backend responded with status: ${response.status}`);
            const errorText = await response.text();
            console.error(`Backend error response: ${errorText}`);

            return NextResponse.json(
                { error: 'File not found or access denied', details: errorText },
                { status: response.status }
            );
        }

        const fileBuffer = await response.arrayBuffer();

        const contentType = response.headers.get('content-type');
        const contentDisposition = response.headers.get('content-disposition');

        const headers = new Headers();
        if (contentType) headers.set('content-type', contentType);
        if (contentDisposition) headers.set('content-disposition', contentDisposition);
        headers.set('cache-control', 'public, max-age=3600');

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
