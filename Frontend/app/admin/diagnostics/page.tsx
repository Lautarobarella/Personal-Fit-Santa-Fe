'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileHeader } from '@/components/ui/mobile-header';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface EndpointStatus {
    name: string;
    url: string;
    status: 'loading' | 'success' | 'error' | 'timeout';
    response?: any;
    error?: string;
    responseTime?: number;
}

export default function DiagnosticsPage() {
    const router = useRouter();
    const [endpoints, setEndpoints] = useState<EndpointStatus[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastCheck, setLastCheck] = useState<Date | null>(null);

    const endpointsToCheck = [
        {
            name: 'Webhook MercadoPago (GET)',
            url: '/api/webhook/mercadopago'
        },
        {
            name: 'Webhook MercadoPago (POST)',
            url: '/api/webhook/mercadopago'
        },
        {
            name: 'Webhook Test (GET)',
            url: '/api/webhook/test'
        },
        {
            name: 'Webhook Test (POST)',
            url: '/api/webhook/test'
        },
        {
            name: 'Test MercadoPago',
            url: '/api/test-mercadopago'
        },
        {
            name: 'Pagos Pendientes (GET)',
            url: '/api/process-pending-payments'
        },
        {
            name: 'Pagos Pendientes (POST)',
            url: '/api/process-pending-payments'
        }
    ];

    const checkEndpoint = async (endpoint: { name: string; url: string }, method: 'GET' | 'POST' = 'GET'): Promise<EndpointStatus> => {
        const startTime = Date.now();
        
        try {
            const options: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            // Para POST requests, agregar un body simple
            if (method === 'POST') {
                options.body = JSON.stringify({ test: true });
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

            const response = await fetch(endpoint.url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                return {
                    name: `${endpoint.name} (${method})`,
                    url: endpoint.url,
                    status: 'success',
                    response: data,
                    responseTime
                };
            } else {
                return {
                    name: `${endpoint.name} (${method})`,
                    url: endpoint.url,
                    status: 'error',
                    error: `HTTP ${response.status}: ${response.statusText}`,
                    responseTime
                };
            }
        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            
            if (error.name === 'AbortError') {
                return {
                    name: `${endpoint.name} (${method})`,
                    url: endpoint.url,
                    status: 'timeout',
                    error: 'Timeout después de 10 segundos',
                    responseTime
                };
            }

            return {
                name: `${endpoint.name} (${method})`,
                url: endpoint.url,
                status: 'error',
                error: error.message || 'Error desconocido',
                responseTime
            };
        }
    };

    const runDiagnostics = async () => {
        setLoading(true);
        const results: EndpointStatus[] = [];

        for (const endpoint of endpointsToCheck) {
            // Probar GET
            const getResult = await checkEndpoint(endpoint, 'GET');
            results.push(getResult);

            // Para algunos endpoints, también probar POST
            if (endpoint.url.includes('webhook') || endpoint.url.includes('pending')) {
                const postResult = await checkEndpoint(endpoint, 'POST');
                results.push(postResult);
            }
        }

        setEndpoints(results);
        setLastCheck(new Date());
        setLoading(false);
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'timeout':
                return <Clock className="w-5 h-5 text-orange-500" />;
            case 'loading':
                return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
            default:
                return <WifiOff className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'error':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'timeout':
                return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'loading':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const formatResponseTime = (time?: number) => {
        if (!time) return 'N/A';
        return `${time}ms`;
    };

    const successCount = endpoints.filter(e => e.status === 'success').length;
    const errorCount = endpoints.filter(e => e.status === 'error').length;
    const timeoutCount = endpoints.filter(e => e.status === 'timeout').length;

    return (
        <div className="min-h-screen bg-background">
            <MobileHeader 
                title="Diagnóstico del Sistema" 
                showBack 
                onBack={() => router.back()} 
            />
            
            <div className="container py-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Diagnóstico del Sistema</h1>
                            <p className="text-gray-600">
                                Verifica el estado de todos los endpoints del sistema
                            </p>
                        </div>
                        <Button
                            onClick={runDiagnostics}
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Ejecutar Diagnóstico
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Endpoints</p>
                                        <p className="text-2xl font-bold">{endpoints.length}</p>
                                    </div>
                                    <Wifi className="w-8 h-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Exitosos</p>
                                        <p className="text-2xl font-bold text-green-600">{successCount}</p>
                                    </div>
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Errores</p>
                                        <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                                    </div>
                                    <AlertCircle className="w-8 h-8 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Timeouts</p>
                                        <p className="text-2xl font-bold text-orange-600">{timeoutCount}</p>
                                    </div>
                                    <Clock className="w-8 h-8 text-orange-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Last Check */}
                    {lastCheck && (
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-gray-600">
                                    Última verificación: {lastCheck.toLocaleString('es-AR')}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Endpoints List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Estado de Endpoints</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {endpoints.map((endpoint, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center justify-between p-4 border rounded-lg ${getStatusColor(endpoint.status)}`}
                                    >
                                        <div className="flex items-center space-x-4">
                                            {getStatusIcon(endpoint.status)}
                                            <div>
                                                <p className="font-medium">{endpoint.name}</p>
                                                <p className="text-sm text-gray-600">{endpoint.url}</p>
                                                {endpoint.responseTime && (
                                                    <p className="text-xs text-gray-500">
                                                        Tiempo de respuesta: {formatResponseTime(endpoint.responseTime)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(endpoint.status)}`}>
                                                {endpoint.status}
                                            </span>
                                            {endpoint.error && (
                                                <p className="text-xs text-red-600 mt-1 max-w-xs">
                                                    {endpoint.error}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Instructions */}
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader>
                            <CardTitle className="text-blue-900">¿Qué verifica este diagnóstico?</CardTitle>
                        </CardHeader>
                        <CardContent className="text-blue-800">
                            <div className="space-y-2 text-sm">
                                <p>• <strong>Webhooks:</strong> Verifica que los endpoints de MercadoPago respondan correctamente</p>
                                <p>• <strong>Configuración:</strong> Comprueba que las variables de entorno estén configuradas</p>
                                <p>• <strong>Conectividad:</strong> Verifica que todos los endpoints sean accesibles</p>
                                <p>• <strong>Tiempo de respuesta:</strong> Mide el tiempo de respuesta de cada endpoint</p>
                                <p>• <strong>Timeouts:</strong> Detecta endpoints que tardan más de 10 segundos en responder</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 