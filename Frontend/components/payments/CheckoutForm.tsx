"use client";

import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Props del componente CheckoutForm
 */
interface CheckoutFormProps {
    productId: string;
    productName: string;
    productPrice: number;
}

/**
 * Componente de formulario de checkout
 * Maneja la creación de preferencias de pago y redirección a MercadoPago
 */
export default function CheckoutForm({
    productId,
    productName,
    productPrice
}: CheckoutFormProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    /**
     * Maneja el envío del formulario de checkout
     * Crea una preferencia de pago y redirige al usuario a MercadoPago
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar que el usuario esté logueado
        if (!user) {
            setError('Debes estar logueado para realizar un pago');
            return;
        }

        // Debug: mostrar información del usuario
        console.log('Usuario actual:', user);
        console.log('DNI del usuario:', user.dni);

        setLoading(true);
        setError('');

        try {
            const checkoutData = {
                productId,
                userEmail: user.email,
                userDni: user.dni,
            };

            console.log('Datos enviados al checkout:', checkoutData);

            // Usar la función del API de checkout
            const { createCheckoutPreference } = await import('@/api/checkout/checkoutApi');
            const data = await createCheckoutPreference(productId, productName, productPrice);

            if (data.sandboxInitPoint) {
                window.location.href = data.sandboxInitPoint;
            } else if (data.initPoint) {
                window.location.href = data.initPoint;
            } else {
                throw new Error('No se recibió URL de pago de MercadoPago');
            }

        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error al procesar el pago');
        } finally {
            setLoading(false);
        }
    };

    // Si no hay usuario, mostrar mensaje
    if (!user) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Debes estar logueado para realizar un pago</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        Iniciar Sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Confirmar Pago</h3>
            </div>
            <div className="p-6">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600 text-sm">Producto:</span>
                        <span className="font-medium text-gray-900">{productName}</span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600 text-sm">Precio:</span>
                        <span className="text-xl font-bold text-green-600">
                            ${productPrice.toLocaleString('es-AR')}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Cliente:</span>
                        <span className="font-medium text-gray-900">{user.firstName} {user.lastName}</span>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : 'Pagar con MercadoPago'}
                    </button>
                </div>
            </div>
        </div>
    );
} 