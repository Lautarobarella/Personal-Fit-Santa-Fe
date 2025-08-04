"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FailurePageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');
    const externalReference = searchParams.get('external_reference');

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="text-red-600">Pago Fallido</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.
                    </p>

                    {paymentId && (
                        <div className="bg-gray-50 p-3 rounded-lg text-sm">
                            <p><strong>ID de Pago:</strong> {paymentId}</p>
                            {status && <p><strong>Estado:</strong> {status}</p>}
                            {externalReference && <p><strong>Referencia:</strong> {externalReference}</p>}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Button
                            onClick={() => router.push('/payments/new-mp')}
                            className="w-full"
                        >
                            Intentar nuevamente
                        </Button>
                        <Button
                            onClick={() => router.push('/payments')}
                            variant="outline"
                            className="w-full"
                        >
                            Ver mis pagos
                        </Button>
                        <Button
                            onClick={() => router.push('/dashboard')}
                            variant="ghost"
                            className="w-full"
                        >
                            Ir al inicio
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function FailurePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="w-full max-w-md mx-4">
                    <CardContent className="text-center py-8">
                        <p className="text-gray-600">Cargando...</p>
                    </CardContent>
                </Card>
            </div>
        }>
            <FailurePageContent />
        </Suspense>
    );
}