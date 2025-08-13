// Mock NextResponse.json to avoid dependency on real Fetch API in Node
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}))

// Import lazily inside tests after mocks are set
let routeModule: any

// Mock mercadopago library to avoid side effects when processing asynchronously
jest.mock('@/lib/mercadopago', () => ({
  processWebhookNotification: jest.fn().mockResolvedValue({ success: true }),
}))

describe('MercadoPago Webhook route', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, WEBHOOK_SECRET: 'testsecret' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('rechaza con 401 cuando falta o no coincide x-signature', async () => {
    const badReq = {
      headers: { get: (name: string) => (name.toLowerCase() === 'x-signature' ? 'wrong' : (name.toLowerCase() === 'content-type' ? 'application/json' : null)) },
      json: async () => ({ type: 'payment', data: { id: '123' } }),
    } as any

    routeModule = require('@/app/payments/mercadopago/webhook/route')
    const res = await routeModule.POST(badReq as any)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toMatch(/Firma inválida/i)
  })

  it('acepta con 200 cuando x-signature coincide', async () => {
    const goodReq = {
      headers: { get: (name: string) => (name.toLowerCase() === 'x-signature' ? 'testsecret' : (name.toLowerCase() === 'content-type' ? 'application/json' : null)) },
      json: async () => ({ type: 'payment', data: { id: '123' } }),
    } as any

    routeModule = require('@/app/payments/mercadopago/webhook/route')
    const res = await routeModule.POST(goodReq as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.message).toMatch(/Webhook recibido/i)
  })
})


