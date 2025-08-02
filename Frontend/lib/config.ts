// Configuración central para las URLs de la API
const getApiBaseUrl = () => {
  // Usar variable de entorno si está disponible
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // En desarrollo (fuera de Docker), usar localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8080';
  }
  
  // En Docker, usar el nombre del servicio
  return 'http://personalfit-backend:8080';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  PAYMENT_URL: `${getApiBaseUrl()}/api/payment`,
  USER_URL: `${getApiBaseUrl()}/api/user`,
  ACTIVITIES_URL: `${getApiBaseUrl()}/api/activities`,
  NOTIFICATION_URL: `${getApiBaseUrl()}/api/notification`,
  FILES_URL: `${getApiBaseUrl()}/api/files`,
}; 