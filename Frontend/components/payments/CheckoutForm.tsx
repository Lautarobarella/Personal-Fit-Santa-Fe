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

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(checkoutData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al crear la preferencia de pago');
            }

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
            <div className="card">
                <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Debes estar logueado para realizar un pago</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="btn-primary"
                    >
                        Iniciar Sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información del usuario */}
                <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Cliente</h3>
                    <div className="space-y-1 text-sm">
                        <p><span className="text-blue-700">Nombre:</span> {user.firstName} {user.lastName}</p>
                        <p><span className="text-blue-700">Email:</span> {user.email}</p>
                        <p><span className="text-blue-700">DNI:</span> {user.dni}</p>
                    </div>
                </div>

                {/* Información del producto */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Producto</h3>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Nombre:</span>
                        <span className="font-semibold">{productName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Precio:</span>
                        <span className="text-xl font-bold text-green-600">
                            ${productPrice.toLocaleString('es-AR')}
                        </span>
                    </div>
                </div>

                {/* Mensaje de error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Información sobre MercadoPago */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">💳 Métodos de pago disponibles</h4>
                    <div className="text-sm text-green-700 space-y-1">
                        <p>• Tarjetas de crédito y débito</p>
                        <p>• Transferencia bancaria</p>
                        <p>• Efectivo (Rapipago, Pago Fácil)</p>
                        <p>• Billeteras digitales</p>
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                        ✅ Pago 100% seguro con MercadoPago
                    </p>
                </div>

                {/* Botón de pago */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creando preferencia de pago...
                        </div>
                    ) : (
                        '💳 Pagar con MercadoPago'
                    )}
                </button>

                {/* Información adicional */}
                <div className="text-center space-y-2">
                    <p className="text-xs text-gray-500">
                        Al continuar, serás redirigido a MercadoPago para completar tu pago de forma segura
                    </p>
                    <p className="text-xs text-blue-600">
                        🔒 Ambiente de pruebas - No se realizará un cobro real
                    </p>
                </div>
            </form>
        </div>
    );
} 