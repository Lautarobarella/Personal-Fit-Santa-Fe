/**
 * Version Manager - Detecta cambios de versión y limpia cache automáticamente
 * Incrementa BUILD_VERSION cada vez que resetees la base de datos o hagas cambios importantes
 */

// IMPORTANTE: Incrementa este número cada vez que resetees la BD o hagas cambios que requieran limpiar cache
export const BUILD_VERSION = '1.0.6';
const VERSION_KEY = 'app_build_version';

/**
 * Verifica si hay una nueva versión y limpia el cache si es necesario
 * Retorna true si se limpió el cache
 */
export const checkVersionAndClearCache = async (): Promise<boolean> => {
    console.log('🚀 [VERSION-MANAGER] Iniciando verificación de versión...');
    console.log('🚀 [VERSION-MANAGER] BUILD_VERSION actual:', BUILD_VERSION);
    console.log('🚀 [VERSION-MANAGER] VERSION_KEY:', VERSION_KEY);
    
    if (typeof window === 'undefined') {
        console.log('⚠️ [VERSION-MANAGER] Window no definido (SSR), saltando verificación');
        return false;
    }

    try {
        console.log('🔍 [VERSION-MANAGER] Obteniendo versión almacenada de localStorage...');
        const storedVersion = localStorage.getItem(VERSION_KEY);
        console.log('📦 [VERSION-MANAGER] Versión almacenada:', storedVersion === null ? 'NULL (primera vez)' : `"${storedVersion}"`);
        
        console.log('🔍 [VERSION-MANAGER] Comparando versiones...');
        console.log('🔍 [VERSION-MANAGER] storedVersion:', storedVersion);
        console.log('🔍 [VERSION-MANAGER] BUILD_VERSION:', BUILD_VERSION);
        console.log('🔍 [VERSION-MANAGER] ¿Son diferentes?:', storedVersion !== BUILD_VERSION);

        // Si la versión cambió o no existe, limpiar todo
        if (storedVersion !== BUILD_VERSION) {
            console.log('✅ [VERSION-MANAGER] CONDICIÓN CUMPLIDA - Iniciando limpieza...');
            console.log('🔄 Nueva versión detectada. Limpiando cache...');
            console.log(`📊 Versión anterior: ${storedVersion || 'ninguna'}, Nueva: ${BUILD_VERSION}`);

            console.log('🧹 [VERSION-MANAGER] Llamando a clearAppCache()...');
            await clearAppCache();
            console.log('✅ [VERSION-MANAGER] clearAppCache() completado');

            // Guardar la nueva versión
            console.log('💾 [VERSION-MANAGER] Guardando nueva versión en localStorage...');
            localStorage.setItem(VERSION_KEY, BUILD_VERSION);
            const verificacion = localStorage.getItem(VERSION_KEY);
            console.log('✅ [VERSION-MANAGER] Nueva versión guardada. Verificación:', verificacion);

            console.log('✅ Cache limpiado. Recargando aplicación...');
            console.log('🔄 [VERSION-MANAGER] Retornando TRUE para forzar recarga...');
            return true;
        }

        console.log('ℹ️ [VERSION-MANAGER] Versiones coinciden, no se requiere limpieza');
        console.log('ℹ️ [VERSION-MANAGER] Retornando FALSE (sin cambios)');
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
    console.log('🧹 [CLEAR-CACHE] === INICIANDO LIMPIEZA COMPLETA ===');
    
    try {
        // 1. Limpiar LocalStorage (mantener solo la clave de versión)
        console.log('🗑️ [CLEAR-CACHE] Paso 1/5: Limpiando LocalStorage...');
        const versionValue = localStorage.getItem(VERSION_KEY);
        console.log('🗑️ [CLEAR-CACHE] Versión a preservar:', versionValue);
        
        const keysBeforeClear = Object.keys(localStorage);
        console.log('🗑️ [CLEAR-CACHE] Keys en localStorage antes de limpiar:', keysBeforeClear);
        
        localStorage.clear();
        console.log('🗑️ [CLEAR-CACHE] localStorage.clear() ejecutado');
        
        if (versionValue) {
            localStorage.setItem(VERSION_KEY, versionValue);
            console.log('🗑️ [CLEAR-CACHE] Versión restaurada en localStorage');
        }
        
        const keysAfterClear = Object.keys(localStorage);
        console.log('🗑️ [CLEAR-CACHE] Keys en localStorage después de limpiar:', keysAfterClear);
        console.log('✅ [CLEAR-CACHE] LocalStorage limpiado');

        // 2. Limpiar SessionStorage
        console.log('🗑️ [CLEAR-CACHE] Paso 2/5: Limpiando SessionStorage...');
        const sessionKeysBeforeClear = Object.keys(sessionStorage);
        console.log('🗑️ [CLEAR-CACHE] Keys en sessionStorage antes:', sessionKeysBeforeClear);
        
        sessionStorage.clear();
        console.log('✅ [CLEAR-CACHE] SessionStorage limpiado');

        // 3. Desregistrar y limpiar Service Workers
        console.log('🗑️ [CLEAR-CACHE] Paso 3/5: Limpiando Service Workers...');
        if ('serviceWorker' in navigator) {
            console.log('🗑️ [CLEAR-CACHE] Service Worker API disponible');
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                console.log('🗑️ [CLEAR-CACHE] Service Workers encontrados:', registrations.length);
                
                for (const registration of registrations) {
                    console.log('🗑️ [CLEAR-CACHE] Desregistrando SW:', registration.scope);
                    await registration.unregister();
                    console.log('✅ [CLEAR-CACHE] Service Worker desregistrado:', registration.scope);
                }
                
                if (registrations.length === 0) {
                    console.log('ℹ️ [CLEAR-CACHE] No hay Service Workers registrados');
                }
            } catch (error) {
                console.warn('⚠️ [CLEAR-CACHE] Error al desregistrar Service Workers:', error);
            }
        } else {
            console.log('ℹ️ [CLEAR-CACHE] Service Worker API no disponible en este navegador');
        }

        // 4. Limpiar Cache Storage (usado por Service Workers)
        console.log('🗑️ [CLEAR-CACHE] Paso 4/5: Limpiando Cache Storage...');
        if ('caches' in window) {
            console.log('🗑️ [CLEAR-CACHE] Cache API disponible');
            try {
                const cacheNames = await caches.keys();
                console.log('🗑️ [CLEAR-CACHE] Caches encontrados:', cacheNames.length, cacheNames);
                
                await Promise.all(
                    cacheNames.map(cacheName => {
                        console.log(`🗑️ [CLEAR-CACHE] Eliminando cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    })
                );
                
                console.log('✅ [CLEAR-CACHE] Todos los caches eliminados');
                
                if (cacheNames.length === 0) {
                    console.log('ℹ️ [CLEAR-CACHE] No hay caches almacenados');
                }
            } catch (error) {
                console.warn('⚠️ [CLEAR-CACHE] Error al limpiar Cache Storage:', error);
            }
        } else {
            console.log('ℹ️ [CLEAR-CACHE] Cache API no disponible en este navegador');
        }

        // 5. Limpiar IndexedDB (usado por Firebase)
        console.log('🗑️ [CLEAR-CACHE] Paso 5/5: Limpiando IndexedDB...');
        if ('indexedDB' in window) {
            console.log('🗑️ [CLEAR-CACHE] IndexedDB API disponible');
            try {
                const databases = await window.indexedDB.databases?.();
                if (databases) {
                    console.log('🗑️ [CLEAR-CACHE] IndexedDB encontradas:', databases.length, databases.map(db => db.name));
                    
                    for (const db of databases) {
                        if (db.name) {
                            console.log(`🗑️ [CLEAR-CACHE] Eliminando IndexedDB: ${db.name}`);
                            window.indexedDB.deleteDatabase(db.name);
                            console.log(`✅ [CLEAR-CACHE] IndexedDB eliminada: ${db.name}`);
                        }
                    }
                    
                    if (databases.length === 0) {
                        console.log('ℹ️ [CLEAR-CACHE] No hay IndexedDB almacenadas');
                    }
                } else {
                    console.log('ℹ️ [CLEAR-CACHE] indexedDB.databases() no disponible');
                }
            } catch (error) {
                console.warn('⚠️ [CLEAR-CACHE] Error al limpiar IndexedDB:', error);
            }
        } else {
            console.log('ℹ️ [CLEAR-CACHE] IndexedDB API no disponible en este navegador');
        }

        console.log('✅ [CLEAR-CACHE] === LIMPIEZA COMPLETA FINALIZADA ===');
    } catch (error) {
        console.error('❌ [CLEAR-CACHE] ERROR CRÍTICO durante la limpieza:', error);
        console.error('❌ [CLEAR-CACHE] Stack:', error instanceof Error ? error.stack : 'N/A');
    }
};

/**
 * Obtiene la versión actual de la aplicación
 */
export const getCurrentVersion = (): string => {
    return BUILD_VERSION;
};
