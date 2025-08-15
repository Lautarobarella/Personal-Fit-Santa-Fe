import { jwtPermissionsApi } from '@/api/JWTAuth/api'
import {
    fetchAllPayments,
    fetchArchivedMonthlyRevenues,
    fetchCurrentMonthRevenue,
    fetchPaymentDetails,
    fetchUserPayments
} from '@/api/payments/paymentsApi'

jest.mock('@/api/JWTAuth/api', () => ({
  jwtPermissionsApi: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  }
}))

describe('paymentsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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

  it('fetchCurrentMonthRevenue llama al endpoint correcto', async () => {
    const mockRevenue = { 
      id: 1, 
      year: 2025, 
      month: 8, 
      monthName: 'agosto',
      totalRevenue: 50000, 
      totalPayments: 2, 
      isCurrentMonth: true 
    }
    ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockRevenue)
    
    const result = await fetchCurrentMonthRevenue()
    
    expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/payments/revenue/current')
    expect(result).toEqual(mockRevenue)
  })

  it('fetchArchivedMonthlyRevenues llama al endpoint correcto', async () => {
    const mockArchivedRevenues = [
      { 
        id: 1, 
        year: 2025, 
        month: 7, 
        monthName: 'julio',
        totalRevenue: 45000, 
        totalPayments: 3, 
        isCurrentMonth: false 
      }
    ]
    ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockArchivedRevenues)
    
    const result = await fetchArchivedMonthlyRevenues()
    
    expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/payments/revenue/history')
    expect(result).toEqual(mockArchivedRevenues)
  })
})

