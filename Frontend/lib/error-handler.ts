import { toast } from '@/hooks/use-toast'
import { ApiError } from '../api/JWTAuth/api'

/**
 * Global API Error Handler
 * 
 * Centralized utility to catch and display errors from the API layer.
 * normalizes error codes (404, 401, 500) into user-friendly UI feedback (Toasts).
 * 
 * @param error - The raw error object (can be ApiError, Error, or unknown)
 * @param defaultMessage - Fallback text if the error contains no description
 */
export const handleApiError = (error: unknown, defaultMessage = 'Ocurrió un error') => {
  // Always log for debugging purposes, but expose cleaner info to the user
  console.error('API Error:', error)

  let title = 'Error'
  let message = defaultMessage

  if (error instanceof ApiError) {
    title = error.error || 'Error'
    message = error.message || defaultMessage

    // Strategy Pattern: Handle specific HTTP status codes with tailored messages
    switch (error.status) {
      case 400:
        // Bad Request: Typically input error
        title = 'Error'
        message = error.message || 'Datos inválidos'
        break
      case 401:
        // Unauthorized: Session death
        title = 'Error de autenticación'
        message = 'Sesión expirada. Por favor, inicia sesión nuevamente.'
        break
      case 403:
        // Forbidden: RBAC failure
        title = 'Acceso denegado'
        message = 'No tienes permisos para realizar esta acción.'
        break
      case 404:
        // Not Found
        title = 'No encontrado'
        message = 'El recurso solicitado no fue encontrado.'
        break
      case 409:
        // Conflict: Duplicate resources
        title = 'Conflicto'
        message = 'El recurso ya existe o hay un conflicto.'
        break
      case 422:
        // Unprocessable Entity: Validation failure
        title = 'Datos inválidos'
        message = 'Los datos proporcionados no son válidos.'
        break
      case 500:
        // Server Error: Catastrophic failure
        title = 'Error del servidor'
        message = 'Error interno del servidor. Inténtalo más tarde.'
        break
    }
  } else if (error instanceof Error) {
    // Generic JS Error fallback
    message = error.message
  }

  // Trigger UI Notification
  toast({
    title,
    description: message,
    variant: 'destructive',
  })
}

/**
 * Validation Error Handler
 * 
 * Specific handler for Form Validation errors (HTTP 422).
 * Parsing the backend's validation map (field -> error) and triggering individual
 * toasts or messages for granular feedback.
 * 
 * @param error - The API error containing validation details
 */
export const handleValidationError = (error: ApiError) => {
  if (error.details && typeof error.details === 'object') {
    // Iterate over field-specific errors
    Object.entries(error.details).forEach(([field, message]) => {
      toast({
        title: `Error en ${field}`,
        description: message as string,
        variant: 'destructive',
      })
    })
  } else {
    // Fallback if details are unstructured
    toast({
      title: 'Error de validación',
      description: error.message,
      variant: 'destructive',
    })
  }
}

/**
 * Type Guard: Is Validation Error?
 * 
 * @param error - The error to check
 * @returns true if status is 422
 */
export const isValidationError = (error: unknown): error is ApiError => {
  return error instanceof ApiError && error.status === 422
}

/**
 * Type Guard: Is Authentication Error?
 * 
 * @param error - The error to check
 * @returns true if status is 401
 */
export const isAuthError = (error: unknown): error is ApiError => {
  return error instanceof ApiError && error.status === 401
}
