import { jwtPermissionsApi } from '@/api/JWTAuth/api'
import { fetchAllPayments, fetchPaymentDetails, fetchUserPayments } from '@/api/payments/paymentsApi'

jest.mock('@/api/JWTAuth/api', () => ({
  jwtPermissionsApi: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  }
}))

describe('paymentsApi', () => {
  it('fetchAllPayments llama al endpoint correcto', async () => {
    ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce([])
    await fetchAllPayments()
    expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/payments/getAll')
  })

  it('fetchUserPayments llama al endpoint correcto', async () => {
    ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce([])
    await fetchUserPayments(123)
    expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/payments/123')
  })

  it('fetchPaymentDetails llama al endpoint correcto', async () => {
    ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce({ id: 1, receiptId: null })
    await fetchPaymentDetails(1)
    expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/payments/info/1')
  })
})


