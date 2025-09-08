// Configuración centralizada para URLs de la aplicación
// Usa variables de entorno si están disponibles, sino usa las URLs del docker-compose para desarrollo local

export const API_CONFIG = {
  // URL base del backend - definida en docker-compose
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
} as const;

// Función helper para construir URLs de archivos
export function buildFileUrl(fileId: number | null | undefined): string | null {
  if (!fileId) return null;
  // Usar el endpoint del backend directamente
  return `${API_CONFIG.BACKEND_URL}/api/payments/files/${fileId}`;
}

// Función helper para construir URLs de la API
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BACKEND_URL}${endpoint}`;
} 