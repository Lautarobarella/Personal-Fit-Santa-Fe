"use client";

import CheckoutForm from '@/components/payments/CheckoutForm';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Skeleton } from '@/components/ui/skeleton';
import { getProducts, type Product } from '@/lib/products';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NewMercadoPagoPaymentPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadProduct() {
            try {
                // Cargar el producto de cuota mensual (sabemos que solo hay uno)
                const products = await getProducts();
                if (products.length > 0) {
                    setProduct(products[0]); // Tomar el primer producto (cuota mensual)
                } else {
                    setError('No se encontraron productos disponibles');
                }
            } catch (error) {
                console.error('Error cargando producto:', error);
                setError('Error al cargar información del producto');
            } finally {
                setLoading(false);
            }
        }

        loadProduct();
    }, []);

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="w-full max-w-md mx-4">
                    <CardContent className="text-center py-8">
                        <p className="text-gray-600 mb-4">Debes estar logueado para realizar un pago</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="btn-primary"
                        >
                            Iniciar Sesión
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <MobileHeader 
                    title="Pago con MercadoPago" 
                    showBack 
                    onBack={() => router.back()} 
                />
                <div className="container py-6">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <Skeleton className="h-8 w-3/4" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-background">
                <MobileHeader 
                    title="Error" 
                    showBack 
                    onBack={() => router.back()} 
                />
                <div className="container py-6">
                    <Card className="max-w-2xl mx-auto">
                        <CardContent className="text-center py-8">
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                onClick={() => router.back()}
                                className="btn-primary"
                            >
                                Volver
                            </button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <MobileHeader 
                title="Pago con MercadoPago" 
                showBack 
                onBack={() => router.back()}
                actions={
                    <button
                        onClick={() => router.push('/payments/method-select')}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Cambiar método
                    </button>
                }
            />

            <div className="container py-6">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Encabezado informativo */}
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-blue-900">
                                <CreditCard className="w-5 h-5" />
                                Pago Online con MercadoPago
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-blue-700">
                                <p>• Pago inmediato y seguro</p>
                                <p>• Acepta todos los métodos de pago</p>
                                <p>• Confirmación automática</p>
                                <p className="font-semibold text-blue-800">
                                    🔒 Modo de pruebas - No se realizará un cobro real
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Formulario de checkout */}
                    <CheckoutForm
                        productId={product.id}
                        productName={product.name}
                        productPrice={product.price}
                    />

                    {/* Información adicional */}
                    <Card className="bg-gray-50">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-800 mb-2">
                                ℹ️ ¿Cómo funciona?
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p>1. Haz clic en "Pagar con MercadoPago"</p>
                                <p>2. Serás redirigido a la plataforma segura de MercadoPago</p>
                                <p>3. Completa el pago con tu método preferido</p>
                                <p>4. Vuelve automáticamente a nuestra aplicación</p>
                                <p>5. Tu pago se confirmará al instante</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}