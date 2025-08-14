import { toast } from '@/hooks/use-toast'
import { ApiError } from '../api/JWTAuth/api'

/**
 * Handles API errors and displays appropriate toast notifications
 * @param error - The error to handle
 * @param defaultMessage - Default message if error parsing fails
 */
export const handleApiError = (error: unknown, defaultMessage = 'Ocurrió un error') => {
  console.error('API Error:', error)

  let title = 'Error'
  let message = defaultMessage

  if (error instanceof ApiError) {
    title = error.error || 'Error'
    message = error.message || defaultMessage

    // Handle specific error types
    switch (error.status) {
      case 400:
        // Para errores 400, usar el mensaje específico del backend
        title = 'Error'
        message = error.message || 'Datos inválidos'
        break
      case 401:
        title = 'Error de autenticación'
        message = 'Sesión expirada. Por favor, inicia sesión nuevamente.'
        break
      case 403:
        title = 'Acceso denegado'
        message = 'No tienes permisos para realizar esta acción.'
        break
      case 404:
        title = 'No encontrado'
        message = 'El recurso solicitado no fue encontrado.'
        break
      case 409:
        title = 'Conflicto'
        message = 'El recurso ya existe o hay un conflicto.'
        break
      case 422:
        title = 'Datos inválidos'
        message = 'Los datos proporcionados no son válidos.'
        break
      case 500:
        title = 'Error del servidor'
        message = 'Error interno del servidor. Inténtalo más tarde.'
        break
    }
  } else if (error instanceof Error) {
    message = error.message
  }

  toast({
    title,
    description: message,
    variant: 'destructive',
  })
}

/**
 * Handles form validation errors and displays them as toast notifications
 * @param error - The API error containing validation details
 */
export const handleValidationError = (error: ApiError) => {
  if (error.details && typeof error.details === 'object') {
    // Display each validation error
    Object.entries(error.details).forEach(([field, message]) => {
      toast({
        title: `Error en ${field}`,
        description: message as string,
        variant: 'destructive',
      })
    })
  } else {
    // Fallback to general error message
    toast({
      title: 'Error de validación',
      description: error.message,
      variant: 'destructive',
    })
  }
}

/**
 * Checks if an error is a validation error
 * @param error - The error to check
 * @returns true if it's a validation error
 */
export const isValidationError = (error: unknown): error is ApiError => {
  return error instanceof ApiError && error.status === 422
}

/**
 * Checks if an error is an authentication error
 * @param error - The error to check
 * @returns true if it's an authentication error
 */
export const isAuthError = (error: unknown): error is ApiError => {
  return error instanceof ApiError && error.status === 401
} 