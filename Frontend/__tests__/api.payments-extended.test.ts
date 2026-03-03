import { jwtPermissionsApi } from '@/api/JWTAuth/api'
import {
  fetchAllPayments,
  fetchUserPayments,
  fetchPaymentDetails,
  fetchPaymentsByMonthAndYear,
  updatePaymentStatus,
  fetchArchivedMonthlyRevenues,
} from '@/api/payments/paymentsApi'

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

describe('paymentsApi - extended', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchAllPayments', () => {
    it('llama GET /api/payments/getAll', async () => {
      const mockPayments = [
        { id: 1, clientName: 'Juan', amount: 25000, status: 'PENDING' },
        { id: 2, clientName: 'Ana', amount: 25000, status: 'PAID' },
      ]
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockPayments)

      const result = await fetchAllPayments()

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/payments/getAll')
      expect(result).toHaveLength(2)
    })
  })

  describe('fetchPaymentsByMonthAndYear', () => {
    it('llama GET /api/payments/getAll/{year}/{month}', async () => {
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce([])

      await fetchPaymentsByMonthAndYear(2026, 3)

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/payments/getAll/2026/3')
    })
  })

  describe('fetchUserPayments', () => {
    it('llama GET /api/payments/{userId}', async () => {
      const mockPayments = [{ id: 1, status: 'PAID' }]
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockPayments)

      const result = await fetchUserPayments(10)

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/payments/10')
      expect(result).toHaveLength(1)
    })
  })

  describe('fetchPaymentDetails', () => {
    it('llama GET /api/payments/info/{id} y agrega receiptUrl', async () => {
      const mockPayment = { id: 5, clientName: 'Juan', receiptId: 42 }
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockPayment)

      const result = await fetchPaymentDetails(5)

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/payments/info/5')
      expect(result.id).toBe(5)
    })

    it('maneja payment sin receiptId', async () => {
      const mockPayment = { id: 6, clientName: 'Ana', receiptId: null }
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockPayment)

      const result = await fetchPaymentDetails(6)

      expect(result.receiptId).toBeNull()
    })
  })

  describe('updatePaymentStatus', () => {
    it('llama PUT /api/payments/pending/{id} para aprobar', async () => {
      ;(jwtPermissionsApi.put as jest.Mock).mockResolvedValueOnce({ success: true })

      await updatePaymentStatus(1, 'paid')

      expect(jwtPermissionsApi.put).toHaveBeenCalledWith(
        '/api/payments/pending/1',
        expect.objectContaining({ status: 'paid' })
      )
    })

    it('llama PUT /api/payments/pending/{id} para rechazar con razón', async () => {
      ;(jwtPermissionsApi.put as jest.Mock).mockResolvedValueOnce({ success: true })

      await updatePaymentStatus(2, 'rejected', 'Comprobante inválido')

      expect(jwtPermissionsApi.put).toHaveBeenCalledWith(
        '/api/payments/pending/2',
        expect.objectContaining({
          status: 'rejected',
          rejectionReason: 'Comprobante inválido',
        })
      )
    })
  })

  describe('fetchArchivedMonthlyRevenues', () => {
    it('llama GET /api/payments/revenue/history', async () => {
      const mockRevenues = [
        { year: 2026, month: 1, monthName: 'enero', totalRevenue: 120000 },
        { year: 2026, month: 2, monthName: 'febrero', totalRevenue: 135000 },
      ]
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockRevenues)

      const result = await fetchArchivedMonthlyRevenues()

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/payments/revenue/history')
      expect(result).toHaveLength(2)
      expect(result[0].monthName).toBe('enero')
    })
  })
})
