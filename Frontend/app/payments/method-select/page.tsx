"use client";

import { useAuth } from '@/contexts/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileHeader } from '@/components/ui/mobile-header';
import { UserRole } from '@/lib/types';
import { ArrowRight, CreditCard, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PaymentMethodSelectPage() {
    const router = useRouter();
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    // Redirigir admins directamente a creación manual
    if (user.role === UserRole.ADMIN) {
        router.replace('/payments/method-select/new');
        return null;
    }

    const handleMethodSelect = (method: 'manual' | 'mercadopago') => {
        if (method === 'manual') {
            router.push('/payments/method-select/new');
        } else {
            router.push('/payments/method-select/new-mp');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <MobileHeader
                title="Método de Pago"
                showBack
                onBack={() => router.push('/payments')}
            />

            <div className="container py-6 px-1">
                <div className="max-w-2xl mx-auto space-y-6 px-1">
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

                        {/* Pago con MercadoPago - Solo para clientes */}
                        {user.role === UserRole.CLIENT && (
                            <>
                                {/* Pago Manual */}
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-gray-300">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-gray-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">
                                                        Pago Manual
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        Adjuntar comprobante de pago
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleMethodSelect('manual')}
                                                variant="outline"
                                                className="border-gray-300 hover:bg-gray-50"
                                            >
                                                Subir <ArrowRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <CreditCard className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">Pagar Online</h3>
                                                    <p className="text-sm text-gray-600">
                                                        Pago inmediato con MercadoPago
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleMethodSelect('mercadopago')}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                Pagar <ArrowRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}


                        {/* Información adicional - Solo para clientes */}

                        <Card className="bg-yellow-50 border-yellow-200">
                            <CardContent className="p-4">
                                <h4 className="font-semibold text-yellow-800 mb-2">
                                    💡 ¿Cuál elegir?
                                </h4>
                                <div className="space-y-2 text-sm text-yellow-700">
                                    <p>
                                        <strong>Pago Manual:</strong> Si ya pagaste por transferencia/efectivo.
                                    </p>
                                    <p>
                                        <strong>Pago Online:</strong> Inmediato y automático.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
}