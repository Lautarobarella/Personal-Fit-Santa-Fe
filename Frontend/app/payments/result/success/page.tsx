"use client";

import { useAuth } from '@/contexts/auth-provider';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function SuccessPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();
    const { user } = useRequireAuth();

    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');
    const externalReference = searchParams.get('external_reference');
    const merchantOrderId = searchParams.get('merchant_order_id');

    useEffect(() => {
        const verifyAndFinalize = async () => {
            try {
                // Intentar forzar el procesamiento del pago por si el webhook no llegó
                if (paymentId || externalReference) {
                    await fetch('/payments/mercadopago/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentId, externalReference }),
                    }).catch(() => undefined);
                }
            } finally {
                setLoading(false);
            }
        };
        verifyAndFinalize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentId, externalReference]);

    const handleGoToPayments = async () => {
        // Marcar flag para forzar actualización en la página de pagos
        localStorage.setItem('refreshPayments', 'true');

        // Invalidar queries antes de navegar
        if (user?.id) {
            queryClient.invalidateQueries({ queryKey: ["payments", user.id] });
        }
        router.push('/payments');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="w-full max-w-md mx-4">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            Verificando pago...
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground">
                            Estamos confirmando tu pago, por favor espera.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-green-600">¡Pago Exitoso!</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        Tu pago se ha procesado correctamente. Recibirás una confirmación por email.
                    </p>

                    {paymentId && (
                        <div className="rounded-lg text-sm p-3 bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                            <p><strong>ID de Pago:</strong> {paymentId}</p>
                            {status && <p><strong>Estado:</strong> {status}</p>}
                            {externalReference && <p><strong>Referencia:</strong> {externalReference}</p>}
                            {merchantOrderId && <p><strong>Orden:</strong> {merchantOrderId}</p>}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Button
                            onClick={handleGoToPayments}
                            className="w-full"
                        >
                            Ver mis pagos
                        </Button>
                        <Button
                            onClick={() => router.push('/dashboard')}
                            variant="outline"
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

export default function SuccessPage() {
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
            <SuccessPageContent />
        </Suspense>
    );
}