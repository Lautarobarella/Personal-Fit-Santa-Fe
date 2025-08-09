import { authAPI } from '@/api/JWTAuth/api'

// Mock fetch
global.fetch = jest.fn()

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  describe('login', () => {
    it('should make POST request to login endpoint', async () => {
      const mockResponse = {
        token: 'fake-jwt-token',
        refreshToken: 'fake-refresh-token',
        user: {
          id: 1,
          email: 'test@personalfit.com',
          name: 'Test User',
          role: 'CLIENT',
        },
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const loginData = {
        email: 'test@personalfit.com',
        password: 'password123',
      }

      const result = await authAPI.login(loginData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        }
      )

      expect(result).toEqual(mockResponse)
    })

    it('should throw error on failed login', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      })

      const loginData = {
        email: 'test@personalfit.com',
        password: 'wrongpassword',
      }

      await expect(authAPI.login(loginData)).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const loginData = {
        email: 'test@personalfit.com',
        password: 'password123',
      }

      await expect(authAPI.login(loginData)).rejects.toThrow('Network error')
    })
  })

  describe('refreshToken', () => {
    it('should make POST request to refresh endpoint', async () => {
      const mockResponse = {
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const refreshToken = 'old-refresh-token'
      const result = await authAPI.refreshToken(refreshToken)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/refresh'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        }
      )

      expect(result).toEqual(mockResponse)
    })

    it('should throw error on failed refresh', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid refresh token' }),
      })

      const refreshToken = 'invalid-refresh-token'

      await expect(authAPI.refreshToken(refreshToken)).rejects.toThrow()
    })
  })

  describe('getCurrentUser', () => {
    it('should make GET request to me endpoint with authorization header', async () => {
      const mockResponse = {
        id: 1,
        email: 'test@personalfit.com',
        name: 'Test User',
        role: 'CLIENT',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const token = 'fake-jwt-token'
      const result = await authAPI.getCurrentUser(token)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      expect(result).toEqual(mockResponse)
    })

    it('should throw error when unauthorized', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      })

      const token = 'invalid-token'

      await expect(authAPI.getCurrentUser(token)).rejects.toThrow()
    })
  })

  describe('logout', () => {
    it('should make POST request to logout endpoint', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Logged out successfully' }),
      })

      const token = 'fake-jwt-token'
      await authAPI.logout(token)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      )
    })

    it('should handle logout errors gracefully', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      })

      const token = 'fake-jwt-token'

      // Logout should not throw even if server returns error
      await expect(authAPI.logout(token)).resolves.not.toThrow()
    })
  })
})
