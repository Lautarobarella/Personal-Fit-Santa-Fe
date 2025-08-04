'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileHeader } from '@/components/ui/mobile-header';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PendingPayment {
    mpPaymentId: string;
    status: string;
    retryCount: number;
    createdAt: string;
    lastRetry: string;
}

interface PendingPaymentsInfo {
    total: number;
    payments: PendingPayment[];
}

export default function PendingPaymentsPage() {
    const router = useRouter();
    const [pendingInfo, setPendingInfo] = useState<PendingPaymentsInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchPendingPayments = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/process-pending-payments');
            const data = await response.json();
            
            if (data.success) {
                setPendingInfo(data.info);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Error fetching pending payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const processPendingPayments = async () => {
        try {
            setProcessing(true);
            const response = await fetch('/api/process-pending-payments', {
                method: 'POST',
            });
            const data = await response.json();
            
            if (data.success) {
                console.log('Pagos procesados:', data.result);
                // Recargar la información
                await fetchPendingPayments();
            }
        } catch (error) {
            console.error('Error processing pending payments:', error);
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-AR');
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'failed':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'processed':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'text-yellow-600 bg-yellow-50';
            case 'failed':
                return 'text-red-600 bg-red-50';
            case 'processed':
                return 'text-green-600 bg-green-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <MobileHeader 
                title="Pagos Pendientes" 
                showBack 
                onBack={() => router.back()} 
            />
            
            <div className="container py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Pagos Pendientes de MercadoPago</h1>
                            <p className="text-gray-600">
                                Gestiona los pagos que están esperando procesamiento
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={fetchPendingPayments}
                                disabled={loading}
                                variant="outline"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Actualizar
                            </Button>
                            <Button
                                onClick={processPendingPayments}
                                disabled={processing || !pendingInfo?.total}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
                                Procesar Pendientes
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Pendientes</p>
                                        <p className="text-2xl font-bold">{pendingInfo?.total || 0}</p>
                                    </div>
                                    <Clock className="w-8 h-8 text-yellow-500" />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Última Actualización</p>
                                        <p className="text-sm font-medium">
                                            {lastUpdate ? formatDate(lastUpdate.toISOString()) : 'Nunca'}
                                        </p>
                                    </div>
                                    <RefreshCw className="w-8 h-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Estado</p>
                                        <p className="text-sm font-medium">
                                            {processing ? 'Procesando...' : 'Listo'}
                                        </p>
                                    </div>
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pending Payments List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Lista de Pagos Pendientes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pendingInfo?.payments.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                    <p className="text-gray-600">No hay pagos pendientes</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingInfo?.payments.map((payment) => (
                                        <div
                                            key={payment.mpPaymentId}
                                            className="flex items-center justify-between p-4 border rounded-lg"
                                        >
                                            <div className="flex items-center space-x-4">
                                                {getStatusIcon(payment.status)}
                                                <div>
                                                    <p className="font-medium">
                                                        Pago {payment.mpPaymentId}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Creado: {formatDate(payment.createdAt)}
                                                    </p>
                                                    {payment.lastRetry && (
                                                        <p className="text-sm text-gray-600">
                                                            Último intento: {formatDate(payment.lastRetry)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                                    {payment.status}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    {payment.retryCount} intentos
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Instructions */}
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader>
                            <CardTitle className="text-blue-900">¿Cómo funciona?</CardTitle>
                        </CardHeader>
                        <CardContent className="text-blue-800">
                            <div className="space-y-2 text-sm">
                                <p>• Los pagos pendientes son aquellos que MercadoPago notificó pero aún no se pudieron procesar completamente.</p>
                                <p>• Haz clic en "Procesar Pendientes" para intentar procesarlos nuevamente.</p>
                                <p>• Los pagos exitosos se crearán automáticamente en el sistema.</p>
                                <p>• Los pagos fallidos después de 5 intentos se marcarán como fallidos.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 