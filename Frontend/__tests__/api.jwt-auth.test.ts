import { jwtPermissionsApi } from '@/api/JWTAuth/api'
import { isAuthenticated, refreshAccessToken } from '@/lib/auth'

jest.mock('@/lib/auth', () => ({
  isAuthenticated: jest.fn(),
  refreshAccessToken: jest.fn(),
}))

describe('jwtPermissionsApi auth refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock | undefined)?.mockClear?.()
  })

  afterEach(() => {
    jest.restoreAllMocks()
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
})
