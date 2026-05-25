import { jwtPermissionsApi } from '@/api/JWTAuth/api'
import { isAuthenticated, refreshAccessToken } from '@/lib/auth'

jest.mock('@/lib/auth', () => ({
  isAuthenticated: jest.fn(),
  refreshAccessToken: jest.fn(),
}))

const originalFetch = global.fetch

describe('jwtPermissionsApi auth refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock | undefined)?.mockClear?.()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    global.fetch = originalFetch
  })

  it('renews the session and retries the original request after a 401', async () => {
    ;(isAuthenticated as jest.Mock).mockReturnValue(true)
    ;(refreshAccessToken as jest.Mock).mockResolvedValue(true)
    global.fetch = jest.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, email: 'client@test.com' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))

    const response = await jwtPermissionsApi.get('/api/users/info/1')

    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(response).toEqual({ id: 1, email: 'client@test.com' })
  })

  it('does not retry when refresh fails after a 401', async () => {
    ;(isAuthenticated as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(false)
    ;(refreshAccessToken as jest.Mock).mockResolvedValue(false)
    global.fetch = jest.fn().mockResolvedValueOnce(new Response(null, { status: 401 }))

    await expect(jwtPermissionsApi.get('/api/users/info/1')).rejects.toThrow('Authentication required')

    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('does not refresh when there is no local session marker', async () => {
    ;(isAuthenticated as jest.Mock).mockReturnValue(false)
    global.fetch = jest.fn().mockResolvedValueOnce(new Response(null, { status: 401 }))

    await expect(jwtPermissionsApi.get('/api/users/info/1')).rejects.toThrow('Authentication required')

    expect(refreshAccessToken).not.toHaveBeenCalled()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('throws an auth error when the retry still returns 401', async () => {
    ;(isAuthenticated as jest.Mock).mockReturnValue(true)
    ;(refreshAccessToken as jest.Mock).mockResolvedValue(true)
    global.fetch = jest.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))

    await expect(jwtPermissionsApi.get('/api/users/info/1')).rejects.toThrow('Authentication failed')

    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
