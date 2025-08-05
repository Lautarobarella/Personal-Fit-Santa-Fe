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

            // Usar el endpoint del frontend (Next.js API route)
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
            <div className="card-header">
                <h3 className="text-lg font-semibold">Confirmar Pago</h3>
            </div>
            <div className="card-body">
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Producto:</span>
                        <span className="font-medium">{productName}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Precio:</span>
                        <span className="text-xl font-bold text-green-600">
                            ${productPrice.toLocaleString('es-AR')}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Cliente:</span>
                        <span className="font-medium">{user.firstName} {user.lastName}</span>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger mb-4">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="btn-secondary flex-1"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="btn-primary flex-1"
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : 'Pagar con MercadoPago'}
                    </button>
                </div>
            </div>
        </div>
    );
} 