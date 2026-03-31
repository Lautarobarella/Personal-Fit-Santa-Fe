import { jwtPermissionsApi } from '@/api/JWTAuth/api'
import {
  fetchUsers,
  fetchUserDetail,
  fetchUserByDni,
  fetchCurrentUserById,
  deleteUser,
  createUser,
  createPublicUserRegistration,
  fetchPendingUserVerifications,
  approvePendingUser,
  rejectPendingUser,
} from '@/api/clients/usersApi'

jest.mock('@/api/JWTAuth/api', () => ({
  jwtPermissionsApi: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

jest.mock('@/lib/error-handler', () => ({
  handleApiError: jest.fn(),
  handleValidationError: jest.fn(),
  isValidationError: jest.fn(() => false),
}))

describe('usersApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ---- fetchUsers ----

  describe('fetchUsers', () => {
    it('llama GET /api/users/getAll y retorna usuarios', async () => {
      const mockUsers = [
        { id: 1, firstName: 'Ana', lastName: 'Garcia' },
        { id: 2, firstName: 'Carlos', lastName: 'Lopez' },
      ]
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockUsers)

      const result = await fetchUsers()

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/users/getAll')
      expect(result).toHaveLength(2)
      expect(result).toEqual(mockUsers)
    })

    it('retorna array vacio si la API falla', async () => {
      ;(jwtPermissionsApi.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchUsers()

      expect(result).toEqual([])
    })
  })

  // ---- fetchUserDetail ----

  describe('fetchUserDetail', () => {
    it('llama GET /api/users/info/:id y retorna detalle', async () => {
      const mockUser = { id: 5, firstName: 'Carlos', lastName: 'Perez', role: 'CLIENT' }
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockUser)

      const result = await fetchUserDetail(5)

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/users/info/5')
      expect(result).toEqual(mockUser)
    })

    it('lanza error cuando falla', async () => {
      ;(jwtPermissionsApi.get as jest.Mock).mockRejectedValueOnce(new Error('not found'))

      try {
        await fetchUserDetail(99)
        throw new Error('should have thrown')
      } catch (e: any) {
        expect(e.message).toBe('not found')
      }
    })
  })

  // ---- fetchUserByDni ----

  describe('fetchUserByDni', () => {
    it('retorna datos mapeados del usuario', async () => {
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce({
        id: 10,
        firstName: 'Maria',
        lastName: 'Lopez',
        dni: 12345678,
        status: 'ACTIVE',
      })

      const result = await fetchUserByDni(12345678)

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/users/by-dni/12345678')
      expect(result).toEqual({
        id: 10,
        name: 'Maria Lopez',
        dni: 12345678,
        status: 'ACTIVE',
      })
    })

    it('lanza error sin toast', async () => {
      ;(jwtPermissionsApi.get as jest.Mock).mockRejectedValueOnce(new Error('no user'))

      try {
        await fetchUserByDni(0)
        throw new Error('should have thrown')
      } catch (e: any) {
        expect(e.message).toBe('no user')
      }
      const { handleApiError } = jest.requireMock('@/lib/error-handler')
      expect(handleApiError).not.toHaveBeenCalled()
    })
  })

  // ---- fetchCurrentUserById ----

  describe('fetchCurrentUserById', () => {
    it('retorna datos del usuario por id', async () => {
      const mockUser = { id: 3, firstName: 'Luis', lastName: 'Fernandez' }
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockUser)

      const result = await fetchCurrentUserById(3)

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/users/info/3')
      expect(result).toEqual(mockUser)
    })

    it('lanza error sin toast', async () => {
      ;(jwtPermissionsApi.get as jest.Mock).mockRejectedValueOnce(new Error('err'))

      try {
        await fetchCurrentUserById(3)
        throw new Error('should have thrown')
      } catch (e: any) {
        expect(e.message).toBe('err')
      }
      const { handleApiError } = jest.requireMock('@/lib/error-handler')
      expect(handleApiError).not.toHaveBeenCalled()
    })
  })

  // ---- deleteUser ----

  describe('deleteUser', () => {
    it('llama DELETE /api/users/delete/:id', async () => {
      ;(jwtPermissionsApi.delete as jest.Mock).mockResolvedValueOnce({ success: true })

      const result = await deleteUser(7)

      expect(jwtPermissionsApi.delete).toHaveBeenCalledWith('/api/users/delete/7')
      expect(result).toEqual({ success: true })
    })

    it('lanza error y llama handleApiError', async () => {
      ;(jwtPermissionsApi.delete as jest.Mock).mockRejectedValueOnce(new Error('denied'))

      try {
        await deleteUser(7)
        throw new Error('should have thrown')
      } catch (e: any) {
        expect(e.message).toBe('denied')
      }
      const { handleApiError } = jest.requireMock('@/lib/error-handler')
      expect(handleApiError).toHaveBeenCalled()
    })
  })

  // ---- createUser ----

  describe('createUser', () => {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      dni: '11223344',
      password: 'pass123',
      role: 'CLIENT',
    }

    it('llama POST /api/users/new', async () => {
      const created = { id: 20, ...userData }
      ;(jwtPermissionsApi.post as jest.Mock).mockResolvedValueOnce(created)

      const result = await createUser(userData as any)

      expect(jwtPermissionsApi.post).toHaveBeenCalledWith('/api/users/new', userData)
      expect(result).toEqual(created)
    })

    it('maneja error de validacion', async () => {
      const err = new Error('validation')
      const errorHandler = jest.requireMock('@/lib/error-handler')
      errorHandler.isValidationError.mockReturnValue(true)
      ;(jwtPermissionsApi.post as jest.Mock).mockRejectedValueOnce(err)

      try {
        await createUser(userData as any)
        throw new Error('should have thrown')
      } catch (e: any) {
        expect(e.message).toBe('validation')
      }
      expect(errorHandler.handleValidationError).toHaveBeenCalledWith(err)
    })

    it('maneja error generico', async () => {
      const errorHandler = jest.requireMock('@/lib/error-handler')
      errorHandler.isValidationError.mockReturnValue(false)
      ;(jwtPermissionsApi.post as jest.Mock).mockRejectedValueOnce(new Error('server'))

      try {
        await createUser(userData as any)
        throw new Error('should have thrown')
      } catch (e: any) {
        expect(e.message).toBe('server')
      }
      expect(errorHandler.handleApiError).toHaveBeenCalled()
    })
  })

  // ---- createPublicUserRegistration ----

  describe('createPublicUserRegistration', () => {
    const userData = {
      firstName: 'Public',
      lastName: 'User',
      email: 'public@example.com',
      dni: '99887766',
      password: '99887766',
      role: 'CLIENT',
    }

    it('llama POST /api/users/public/register', async () => {
      const response = { success: true }
      ;(jwtPermissionsApi.post as jest.Mock).mockResolvedValueOnce(response)

      const result = await createPublicUserRegistration(userData as any)

      expect(jwtPermissionsApi.post).toHaveBeenCalledWith('/api/users/public/register', userData, false)
      expect(result).toEqual(response)
    })
  })

  // ---- pending verification endpoints ----

  describe('pending verification', () => {
    it('fetchPendingUserVerifications llama GET /api/users/pending', async () => {
      const pendingUsers = [{ id: 1 }, { id: 2 }]
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(pendingUsers)

      const result = await fetchPendingUserVerifications()

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/users/pending')
      expect(result).toEqual(pendingUsers)
    })

    it('approvePendingUser llama PUT /api/users/pending/:id/approve', async () => {
      ;(jwtPermissionsApi.put as jest.Mock).mockResolvedValueOnce({ success: true })

      const result = await approvePendingUser(12)

      expect(jwtPermissionsApi.put).toHaveBeenCalledWith('/api/users/pending/12/approve', {})
      expect(result).toEqual({ success: true })
    })

    it('rejectPendingUser llama DELETE /api/users/pending/:id/reject', async () => {
      ;(jwtPermissionsApi.delete as jest.Mock).mockResolvedValueOnce({ success: true })

      const result = await rejectPendingUser(12)

      expect(jwtPermissionsApi.delete).toHaveBeenCalledWith('/api/users/pending/12/reject')
      expect(result).toEqual({ success: true })
    })
  })
})
