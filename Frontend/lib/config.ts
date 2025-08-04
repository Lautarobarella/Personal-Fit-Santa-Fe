// Configuración centralizada para URLs de la aplicación
// Todas las URLs se obtienen de variables de entorno definidas en docker-compose

export const API_CONFIG = {
  // URL base del backend - definida en docker-compose
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://72.60.1.76:8080',
  
  // URL base del frontend - definida en docker-compose
  FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://72.60.1.76:3000',
  
  // URL para archivos (comprobantes de pago)
  FILES_URL: process.env.NEXT_PUBLIC_FILES_URL || 'http://72.60.1.76:8080',
} as const;

// Función helper para construir URLs de archivos
export function buildFileUrl(fileId: number | null | undefined): string | null {
  if (!fileId) return null;
  return `${API_CONFIG.FILES_URL}/api/files/${fileId}`;
}

// Función helper para construir URLs de la API
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
} 