"use client"

import { checkVersionAndClearCache } from '@/lib/version-manager';
import { useEffect, useState } from 'react';

/**
 * Componente que verifica la versión de la app y limpia cache si es necesario
 * Se ejecuta una sola vez al cargar la aplicación
 */
export function VersionChecker() {
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkVersion = async () => {
            try {
                const cacheCleared = await checkVersionAndClearCache();

                if (cacheCleared) {
                    // Si se limpió el cache, recargar la página para obtener la versión fresca
                    console.log('🔄 Recargando aplicación con cache limpio...');
                    window.location.reload();
                    // Mantener isChecking en true hasta que recargue
                    return;
                }

                // Si no se limpió cache, continuar normalmente
                setIsChecking(false);
            } catch (error) {
                console.error('Error al verificar versión:', error);
                setIsChecking(false);
            }
        };

        checkVersion();
    }, []);

    // Mostrar un loader mínimo mientras verifica la versión
    if (isChecking) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Verificando versión...</p>
                </div>
            </div>
        );
    }

    return null;
}
