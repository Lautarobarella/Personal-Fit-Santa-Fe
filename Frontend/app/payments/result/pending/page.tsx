"use client";

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PendingPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');
    const externalReference = searchParams.get('external_reference');

    const handleGoToPayments = async () => {
        // Marcar flag para forzar actualización en la página de pagos
        localStorage.setItem('refreshPayments', 'true');
        
        // Invalidar queries antes de navegar
        if (user?.id) {
            queryClient.invalidateQueries({ queryKey: ["payments", user.id] });
        }
        router.push('/payments');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                        <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <CardTitle className="text-yellow-600">Pago Pendiente</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        Tu pago está siendo procesado. Te notificaremos cuando se complete.
                    </p>
                    
                    {paymentId && (
                        <div className="bg-gray-50 p-3 rounded-lg text-sm">
                            <p><strong>ID de Pago:</strong> {paymentId}</p>
                            {status && <p><strong>Estado:</strong> {status}</p>}
                            {externalReference && <p><strong>Referencia:</strong> {externalReference}</p>}
                        </div>
                    )}

                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                        <p>
                            <strong>¿Qué significa esto?</strong><br />
                            Algunos medios de pago requieren confirmación adicional. 
                            El proceso puede tomar hasta 24 horas.
                        </p>
                    </div>

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

export default function PendingPage() {
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
            <PendingPageContent />
        </Suspense>
    );
}