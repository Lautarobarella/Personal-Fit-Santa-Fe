/**
 * Version Manager - Detecta cambios de versión y limpia cache automáticamente
 * Incrementa BUILD_VERSION cada vez que resetees la base de datos o hagas cambios importantes
 */

// IMPORTANTE: Incrementa este número cada vez que resetees la BD o hagas cambios que requieran limpiar cache
export const BUILD_VERSION = '1.0.17';
const VERSION_KEY = 'app_build_version';

/**
 * Verifica si hay una nueva versión y limpia el cache si es necesario
 * Retorna true si se limpió el cache
 */

export const checkVersionAndClearCache = async (): Promise<boolean> => {

    if (typeof window === 'undefined') {
        console.warn('⚠️ [VERSION-MANAGER] Window no definido (SSR), saltando verificación');
        return false;
    }

    try {
        const storedVersion = localStorage.getItem(VERSION_KEY);

        // Si la versión cambió o no existe, limpiar todo
        if (storedVersion !== BUILD_VERSION) {
            await clearAppCache();

            // Guardar la nueva versión
            localStorage.setItem(VERSION_KEY, BUILD_VERSION);
            return true;
        }

        return false;
    } catch (error) {
        console.error('❌ [VERSION-MANAGER] ERROR al verificar versión:', error);
        console.error('❌ [VERSION-MANAGER] Stack:', error instanceof Error ? error.stack : 'N/A');
        return false;
    }
};

/**
 * Limpia todo el cache de la aplicación
 */
const clearAppCache = async (): Promise<void> => {
    try {
        // 1. Limpiar LocalStorage (mantener solo la clave de versión)
        const versionValue = localStorage.getItem(VERSION_KEY);

        localStorage.clear();

        if (versionValue) {
            localStorage.setItem(VERSION_KEY, versionValue);
        }

        // 2. Limpiar SessionStorage
        sessionStorage.clear();

        // 3. Desregistrar y limpiar Service Workers
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();

                for (const registration of registrations) {
                    await registration.unregister();
                }
            } catch (error) {
                console.warn('⚠️ [CLEAR-CACHE] Error al desregistrar Service Workers:', error);
            }
        }

        // 4. Limpiar Cache Storage (usado por Service Workers)
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();

                await Promise.all(
                    cacheNames.map(cacheName => {
                        return caches.delete(cacheName);
                    })
                );
            } catch (error) {
                console.warn('⚠️ [CLEAR-CACHE] Error al limpiar Cache Storage:', error);
            }
        }

        // 5. Limpiar IndexedDB
        if ('indexedDB' in window) {
            try {
                const databases = await window.indexedDB.databases?.();
                if (databases) {
                    for (const db of databases) {
                        if (db.name) {
                            window.indexedDB.deleteDatabase(db.name);
                        }
                    }
                }
            } catch (error) {
                console.warn('⚠️ [CLEAR-CACHE] Error al limpiar IndexedDB:', error);
            }
        }
    } catch (error) {
        console.error('❌ [CLEAR-CACHE] ERROR CRÍTICO durante la limpieza:', error);
    }
};

/**
 * Obtiene la versión actual de la aplicación
 */
export const getCurrentVersion = (): string => {
    return BUILD_VERSION;
};
