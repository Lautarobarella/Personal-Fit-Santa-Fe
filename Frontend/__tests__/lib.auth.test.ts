import { hasPermission, isAuthenticated, getUserId, refreshAccessToken } from '@/lib/auth'

const originalFetch = global.fetch

// authenticate/logout are integration tests that need a real API.

describe('lib/auth - utility functions', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    global.fetch = originalFetch
  })

  describe('getUserId', () => {
    it('retorna null cuando no hay userId en localStorage', () => {
      expect(getUserId()).toBeNull()
    })

    it('retorna el userId como número cuando está almacenado', () => {
      localStorage.setItem('userId', '42')
      expect(getUserId()).toBe(42)
    })

    it('parsea el string a número correctamente', () => {
      localStorage.setItem('userId', '999')
      expect(getUserId()).toBe(999)
    })
  })

  describe('isAuthenticated', () => {
    it('retorna false cuando no hay sesión', () => {
      expect(isAuthenticated()).toBe(false)
    })

    it('retorna true cuando hay userId almacenado', () => {
      localStorage.setItem('userId', '1')
      expect(isAuthenticated()).toBe(true)
    })
  })

  describe('hasPermission', () => {
    it('ADMIN tiene permiso para todo', () => {
      expect(hasPermission('ADMIN' as any, 'ADMIN' as any)).toBe(true)
      expect(hasPermission('ADMIN' as any, 'TRAINER' as any)).toBe(true)
      expect(hasPermission('ADMIN' as any, 'CLIENT' as any)).toBe(true)
    })

    it('TRAINER tiene permiso de TRAINER y CLIENT pero no ADMIN', () => {
      expect(hasPermission('TRAINER' as any, 'ADMIN' as any)).toBe(false)
      expect(hasPermission('TRAINER' as any, 'TRAINER' as any)).toBe(true)
      expect(hasPermission('TRAINER' as any, 'CLIENT' as any)).toBe(true)
    })

    it('CLIENT solo tiene permiso de CLIENT', () => {
      expect(hasPermission('CLIENT' as any, 'ADMIN' as any)).toBe(false)
      expect(hasPermission('CLIENT' as any, 'TRAINER' as any)).toBe(false)
      expect(hasPermission('CLIENT' as any, 'CLIENT' as any)).toBe(true)
    })
  })

  describe('refreshAccessToken', () => {
    it('deduplica refresh concurrentes en una sola request', async () => {
      localStorage.setItem('userId', '1')
      global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
        tokenType: 'Bearer',
        user: { id: 1 },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))

      const results = await Promise.all([
        refreshAccessToken(),
        refreshAccessToken(),
        refreshAccessToken(),
      ])

      expect(results).toEqual([true, true, true])
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })
})
