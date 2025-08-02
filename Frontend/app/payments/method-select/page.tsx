"use client";

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileHeader } from '@/components/ui/mobile-header';
import { ArrowRight, CreditCard, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PaymentMethodSelectPage() {
    const router = useRouter();
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    const handleMethodSelect = (method: 'manual' | 'mercadopago') => {
        if (method === 'manual') {
            router.push('/payments/new');
        } else {
            router.push('/payments/new-mp');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <MobileHeader 
                title="Método de Pago" 
                showBack 
                onBack={() => router.back()} 
            />

            <div className="container py-6">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Información del usuario */}
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-blue-900 text-lg">
                                👋 Hola, {user.firstName}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-blue-700 text-sm">
                                Selecciona cómo quieres realizar tu pago mensual del gimnasio.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Opciones de pago */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-center mb-6">
                            Elige tu método de pago
                        </h2>

                        {/* Pago con MercadoPago */}
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            <CreditCard className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Pago Online</h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                Paga con MercadoPago
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                                                    ✅ Inmediato
                                                </span>
                                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                                                    💳 Tarjetas
                                                </span>
                                                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                                                    📱 Billeteras
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => handleMethodSelect('mercadopago')}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Elegir <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-xs text-blue-700">
                                        🔒 <strong>Modo de pruebas:</strong> No se realizará un cobro real. 
                                        Puedes usar tarjetas de prueba para simular el pago.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pago Manual */}
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-gray-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-gray-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Pago Manual</h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                Subir comprobante manualmente
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">
                                                    ⏳ Requiere verificación
                                                </span>
                                                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                                    📄 Subir comprobante
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => handleMethodSelect('manual')}
                                        variant="outline"
                                        className="border-gray-300 hover:bg-gray-50"
                                    >
                                        Elegir <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Información adicional */}
                    <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-yellow-800 mb-2">
                                💡 ¿Cuál elegir?
                            </h4>
                            <div className="space-y-2 text-sm text-yellow-700">
                                <p>
                                    <strong>Pago Online:</strong> Más rápido y automático. 
                                    Ideal si quieres confirmar tu pago al instante.
                                </p>
                                <p>
                                    <strong>Pago Manual:</strong> Si ya realizaste el pago 
                                    por transferencia/efectivo y necesitas subir el comprobante.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}