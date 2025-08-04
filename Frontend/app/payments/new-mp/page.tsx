"use client";

import CheckoutForm from '@/components/payments/CheckoutForm';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Skeleton } from '@/components/ui/skeleton';
import { getProducts, type Product } from '@/lib/products';
import { CreditCard } from 'lucide-react';
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
                title="Pagar Cuota" 
                showBack 
                onBack={() => router.back()} 
            />

            <div className="container py-6 max-w-lg mx-auto">
                {/* Header simplificado */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                <CreditCard className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold">Cuota Mensual</h2>
                            <p className="text-3xl font-bold text-green-600">
                                ${product.price.toLocaleString('es-AR')}
                            </p>
                            <p className="text-sm text-gray-600">
                                {product.description}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Checkout simplificado */}
                <CheckoutForm
                    productId={product.id}
                    productName={product.name}
                    productPrice={product.price}
                />
            </div>
        </div>
    );
}