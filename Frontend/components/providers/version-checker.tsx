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
        console.log('🎯 [VERSION-CHECKER] Componente montado, iniciando verificación...');
        
        const checkVersion = async () => {
            try {
                console.log('🎯 [VERSION-CHECKER] Llamando a checkVersionAndClearCache()...');
                const cacheCleared = await checkVersionAndClearCache();
                console.log('🎯 [VERSION-CHECKER] Resultado de checkVersionAndClearCache():', cacheCleared);

                if (cacheCleared) {
                    // Si se limpió el cache, recargar la página para obtener la versión fresca
                    console.log('🔄 [VERSION-CHECKER] Cache limpiado, recargando aplicación...');
                    console.log('🔄 Recargando aplicación con cache limpio...');
                    
                    // Esperar un momento antes de recargar para que los logs se registren
                    setTimeout(() => {
                        console.log('🔄 [VERSION-CHECKER] Ejecutando window.location.reload()...');
                        window.location.reload();
                    }, 100);
                    
                    // Mantener isChecking en true hasta que recargue
                    return;
                }

                // Si no se limpió cache, continuar normalmente
                console.log('✅ [VERSION-CHECKER] No se requiere limpieza, continuando normalmente...');
                setIsChecking(false);
            } catch (error) {
                console.error('❌ [VERSION-CHECKER] Error al verificar versión:', error);
                console.error('❌ [VERSION-CHECKER] Stack:', error instanceof Error ? error.stack : 'N/A');
                setIsChecking(false);
            }
        };

        checkVersion();
    }, []);

    // Mostrar un loader mínimo mientras verifica la versión
    if (isChecking) {
        console.log('🎯 [VERSION-CHECKER] Renderizando loader (isChecking = true)');
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Verificando versión...</p>
                </div>
            </div>
        );
    }

    console.log('🎯 [VERSION-CHECKER] Renderizando null (isChecking = false)');
    return null;
}
