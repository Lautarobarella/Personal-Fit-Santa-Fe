"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { AlertCircle, CheckCircle, Info, Loader2, XCircle } from "lucide-react"
import { useState } from "react"

interface EndpointStatus {
    name: string;
    url: string;
    status: 'loading' | 'success' | 'error' | 'timeout';
    response?: any;
    error?: string;
    responseTime?: number;
}

interface MercadoPagoTestResult {
    success: boolean;
    message: string;
    data?: {
        preference: any;
        config: any;
    };
    error?: string;
}

export default function DiagnosticsPage() {
    const { user } = useAuth()
    
    // Use custom hook to redirect to login if not authenticated
    useRequireAuth()
    
    const [endpoints, setEndpoints] = useState<EndpointStatus[]>([]);
    const [mpTestResult, setMpTestResult] = useState<MercadoPagoTestResult | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isTestingMP, setIsTestingMP] = useState(false);

    const endpointsToTest = [
        { name: "MercadoPago Checkout", url: "/payments/mercadopago/checkout" },
        { name: "MercadoPago Webhook", url: "/payments/mercadopago/webhook" },
    ];

    const checkEndpoint = async (endpoint: { name: string; url: string }, method: 'GET' | 'POST' = 'GET'): Promise<EndpointStatus> => {
        const startTime = Date.now();
        
        try {
            const response = await fetch(endpoint.url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const responseTime = Date.now() - startTime;
            const data = await response.json();

            if (response.ok) {
                return {
                    name: endpoint.name,
                    url: endpoint.url,
                    status: 'success',
                    response: data,
                    responseTime
                };
            } else {
                return {
                    name: endpoint.name,
                    url: endpoint.url,
                    status: 'error',
                    error: `HTTP ${response.status}: ${data.error || data.message || 'Error desconocido'}`,
                    responseTime
                };
            }
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                name: endpoint.name,
                url: endpoint.url,
                status: 'error',
                error: error instanceof Error ? error.message : 'Error de conexión',
                responseTime
            };
        }
    };

    const runDiagnostics = async () => {
        setIsRunning(true);
        setEndpoints([]);

        const results: EndpointStatus[] = [];
        
        for (const endpoint of endpointsToTest) {
            const result = await checkEndpoint(endpoint);
            results.push(result);
            setEndpoints([...results]);
        }

        setIsRunning(false);
    };

    const testMercadoPago = async () => {
        setIsTestingMP(true);
        setMpTestResult(null);

        try {
            const response = await fetch('/payments/mercadopago/webhook', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            setMpTestResult(result);
        } catch (error) {
            setMpTestResult({
                success: false,
                message: 'Error al conectar con el endpoint',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }

        setIsTestingMP(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'timeout':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            default:
                return <Info className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'bg-green-100 text-green-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            case 'timeout':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatResponseTime = (time?: number) => {
        if (!time) return 'N/A';
        return `${time}ms`;
    };

    return (
        <div className="min-h-screen bg-background">
            <MobileHeader title="Diagnósticos" showBack />

            <div className="container py-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Diagnósticos del Sistema
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Button 
                                onClick={runDiagnostics} 
                                disabled={isRunning}
                                className="flex-1"
                            >
                                {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Ejecutar Diagnósticos
                            </Button>
                            <Button 
                                onClick={testMercadoPago} 
                                disabled={isTestingMP}
                                variant="outline"
                                className="flex-1"
                            >
                                {isTestingMP && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Probar MercadoPago
                            </Button>
                        </div>

                        {/* Resultados de MercadoPago */}
                        {mpTestResult && (
                            <Card className="border-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {mpTestResult.success ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                        )}
                                        Prueba de MercadoPago
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p className="font-medium">{mpTestResult.message}</p>
                                        {mpTestResult.error && (
                                            <p className="text-red-600 text-sm">{mpTestResult.error}</p>
                                        )}
                                        {mpTestResult.data && (
                                            <div className="space-y-2 text-sm">
                                                <div>
                                                    <strong>Configuración:</strong>
                                                    <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                                                        {JSON.stringify(mpTestResult.data.config, null, 2)}
                                                    </pre>
                                                </div>
                                                {mpTestResult.data.preference && (
                                                    <div>
                                                        <strong>Preferencia creada:</strong>
                                                        <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                                                            {JSON.stringify({
                                                                id: mpTestResult.data.preference.id,
                                                                init_point: mpTestResult.data.preference.init_point,
                                                                sandbox_init_point: mpTestResult.data.preference.sandbox_init_point,
                                                                payment_methods: mpTestResult.data.preference.payment_methods
                                                            }, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Resultados de Endpoints */}
                        {endpoints.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-medium">Estado de Endpoints</h3>
                                {endpoints.map((endpoint, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(endpoint.status)}
                                            <div>
                                                <p className="font-medium">{endpoint.name}</p>
                                                <p className="text-sm text-gray-500">{endpoint.url}</p>
                                                {endpoint.error && (
                                                    <p className="text-sm text-red-600">{endpoint.error}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge className={getStatusColor(endpoint.status)}>
                                                {endpoint.status}
                                            </Badge>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatResponseTime(endpoint.responseTime)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 