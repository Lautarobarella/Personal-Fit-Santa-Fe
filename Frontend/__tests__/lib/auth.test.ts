import { getToken, setToken, removeToken, isTokenExpired } from '@/lib/auth'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

// @ts-ignore
global.localStorage = localStorageMock

describe('Auth utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      const mockToken = 'fake-jwt-token'
      localStorageMock.getItem.mockReturnValue(mockToken)

      const result = getToken()

      expect(localStorageMock.getItem).toHaveBeenCalledWith('token')
      expect(result).toBe(mockToken)
    })

    it('should return null when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = getToken()

      expect(result).toBeNull()
    })
  })

  describe('setToken', () => {
    it('should store token in localStorage', () => {
      const mockToken = 'fake-jwt-token'

      setToken(mockToken)

      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken)
    })

    it('should store both access and refresh tokens', () => {
      const mockAccessToken = 'fake-access-token'
      const mockRefreshToken = 'fake-refresh-token'

      setToken(mockAccessToken, mockRefreshToken)

      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockAccessToken)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', mockRefreshToken)
    })
  })

  describe('removeToken', () => {
    it('should remove token from localStorage', () => {
      removeToken()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken')
    })
  })

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      // Create a token that expired 1 hour ago
      const expiredTime = Math.floor(Date.now() / 1000) - 3600
      const expiredToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: expiredTime }))}.signature`

      const result = isTokenExpired(expiredToken)

      expect(result).toBe(true)
    })

    it('should return false for valid token', () => {
      // Create a token that expires in 1 hour
      const futureTime = Math.floor(Date.now() / 1000) + 3600
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: futureTime }))}.signature`

      const result = isTokenExpired(validToken)

      expect(result).toBe(false)
    })

    it('should return true for malformed token', () => {
      const malformedToken = 'invalid-token'

      const result = isTokenExpired(malformedToken)

      expect(result).toBe(true)
    })

    it('should return true for token without expiration', () => {
      const tokenWithoutExp = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: 'user' }))}.signature`

      const result = isTokenExpired(tokenWithoutExp)

      expect(result).toBe(true)
    })

    it('should return true for null token', () => {
      const result = isTokenExpired(null)

      expect(result).toBe(true)
    })

    it('should return true for undefined token', () => {
      const result = isTokenExpired(undefined)

      expect(result).toBe(true)
    })
  })
})
