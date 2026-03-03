import { handleApiError, handleValidationError, isValidationError, isAuthError } from '@/lib/error-handler'
import { ApiError } from '@/api/JWTAuth/api'

// Mock the toast module
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}))

import { toast } from '@/hooks/use-toast'

describe('error-handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleApiError', () => {
    it('muestra toast con mensaje por defecto para error genérico', () => {
      handleApiError(new Error('algo falló'))

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'algo falló',
          variant: 'destructive',
        })
      )
    })

    it('maneja ApiError 401 - sesión expirada', () => {
      const error = new ApiError('Unauthorized', 401, 'Unauthorized')
      handleApiError(error)

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error de autenticación',
          description: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
        })
      )
    })

    it('maneja ApiError 403 - acceso denegado', () => {
      const error = new ApiError('Forbidden', 403, 'Forbidden')
      handleApiError(error)

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Acceso denegado',
        })
      )
    })

    it('maneja ApiError 404 - no encontrado', () => {
      const error = new ApiError('Not found', 404, 'Not Found')
      handleApiError(error)

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'No encontrado',
        })
      )
    })

    it('maneja ApiError 409 - conflicto', () => {
      const error = new ApiError('Conflict', 409, 'Conflict')
      handleApiError(error)

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Conflicto',
        })
      )
    })

    it('maneja ApiError 500 - error del servidor', () => {
      const error = new ApiError('Server error', 500, 'Internal Server Error')
      handleApiError(error)

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error del servidor',
          description: 'Error interno del servidor. Inténtalo más tarde.',
        })
      )
    })

    it('usa defaultMessage cuando el error no tiene mensaje', () => {
      handleApiError(undefined, 'Mensaje personalizado')

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Mensaje personalizado',
        })
      )
    })
  })

  describe('handleValidationError', () => {
    it('genera toasts individuales por campo cuando hay details', () => {
      const error = new ApiError('Validation failed', 422, 'Validation', {
        email: 'Email is required',
        password: 'Password too short',
      })

      handleValidationError(error)

      expect(toast).toHaveBeenCalledTimes(2)
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error en email',
          description: 'Email is required',
        })
      )
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error en password',
          description: 'Password too short',
        })
      )
    })

    it('genera un solo toast cuando no hay details', () => {
      const error = new ApiError('Datos inválidos', 422, 'Validation')

      handleValidationError(error)

      expect(toast).toHaveBeenCalledTimes(1)
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error de validación',
          description: 'Datos inválidos',
        })
      )
    })
  })

  describe('isValidationError', () => {
    it('retorna true para ApiError con status 422', () => {
      const error = new ApiError('Validation', 422, 'Validation')
      expect(isValidationError(error)).toBe(true)
    })

    it('retorna false para otros status', () => {
      const error = new ApiError('Not found', 404, 'Not Found')
      expect(isValidationError(error)).toBe(false)
    })

    it('retorna false para errores genéricos', () => {
      expect(isValidationError(new Error('generic'))).toBe(false)
    })

    it('retorna false para null/undefined', () => {
      expect(isValidationError(null)).toBe(false)
      expect(isValidationError(undefined)).toBe(false)
    })
  })

  describe('isAuthError', () => {
    it('retorna true para ApiError con status 401', () => {
      const error = new ApiError('Unauthorized', 401, 'Auth')
      expect(isAuthError(error)).toBe(true)
    })

    it('retorna false para otros status', () => {
      const error = new ApiError('Forbidden', 403, 'Auth')
      expect(isAuthError(error)).toBe(false)
    })
  })
})
