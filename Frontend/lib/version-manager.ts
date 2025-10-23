/**
 * Version Manager - Detecta cambios de versión y limpia cache automáticamente
 * Incrementa BUILD_VERSION cada vez que resetees la base de datos o hagas cambios importantes
 */

// IMPORTANTE: Incrementa este número cada vez que resetees la BD o hagas cambios que requieran limpiar cache
export const BUILD_VERSION = '1.0.0';
const VERSION_KEY = 'app_build_version';

/**
 * Verifica si hay una nueva versión y limpia el cache si es necesario
 * Retorna true si se limpió el cache
 */
export const checkVersionAndClearCache = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    try {
        const storedVersion = localStorage.getItem(VERSION_KEY);

        // Si la versión cambió o no existe, limpiar todo
        if (storedVersion !== BUILD_VERSION) {
            console.log('🔄 Nueva versión detectada. Limpiando cache...');
            console.log(`Versión anterior: ${storedVersion || 'ninguna'}, Nueva: ${BUILD_VERSION}`);

            await clearAppCache();

            // Guardar la nueva versión
            localStorage.setItem(VERSION_KEY, BUILD_VERSION);

            console.log('✅ Cache limpiado. Recargando aplicación...');
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error al verificar versión:', error);
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
        console.log('🗑️ LocalStorage limpiado');

        // 2. Limpiar SessionStorage
        sessionStorage.clear();
        console.log('🗑️ SessionStorage limpiado');

        // 3. Desregistrar y limpiar Service Workers
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                    console.log('🗑️ Service Worker desregistrado');
                }
            } catch (error) {
                console.warn('No se pudo desregistrar Service Workers:', error);
            }
        }

        // 4. Limpiar Cache Storage (usado por Service Workers)
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => {
                        console.log(`🗑️ Cache eliminada: ${cacheName}`);
                        return caches.delete(cacheName);
                    })
                );
            } catch (error) {
                console.warn('No se pudo limpiar Cache Storage:', error);
            }
        }

        // 5. Limpiar IndexedDB (usado por Firebase)
        if ('indexedDB' in window) {
            try {
                const databases = await window.indexedDB.databases?.();
                if (databases) {
                    for (const db of databases) {
                        if (db.name) {
                            window.indexedDB.deleteDatabase(db.name);
                            console.log(`🗑️ IndexedDB eliminada: ${db.name}`);
                        }
                    }
                }
            } catch (error) {
                console.warn('No se pudo limpiar IndexedDB:', error);
            }
        }

        console.log('✅ Limpieza completa finalizada');
    } catch (error) {
        console.error('Error durante la limpieza:', error);
    }
};

/**
 * Obtiene la versión actual de la aplicación
 */
export const getCurrentVersion = (): string => {
    return BUILD_VERSION;
};
