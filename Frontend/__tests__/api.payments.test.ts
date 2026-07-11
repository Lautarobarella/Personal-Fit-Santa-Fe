import { jwtPermissionsApi } from '@/api/JWTAuth/api'
import {
  createPayment,
  createInactiveClientsPayment,
  fetchAllPayments,
  fetchPaymentDetails,
  fetchUserPayments
} from '@/api/payments/paymentsApi'
import { MethodType } from '@/lib/types'

jest.mock('@/api/JWTAuth/api', () => ({
  jwtPermissionsApi: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  }
}))

// Igual que en api.payments-extended: se mockea el error-handler para que los
// caminos de error no disparen toasts reales fuera de un árbol de React.
jest.mock('@/lib/error-handler', () => ({
  handleApiError: jest.fn(),
  handleValidationError: jest.fn(),
  isValidationError: jest.fn(() => false),
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

  it('createPayment envía solo campos permitidos y conserva el comprobante grupal', async () => {
    ;(jwtPermissionsApi.post as jest.Mock).mockResolvedValueOnce({ id: 10, success: true })
    const receipt = new File(['pdf-content'], 'grupo.pdf', { type: 'application/pdf' })

    await createPayment({
      clientDnis: [30111111, 30222222],
      expectedMonthlyFee: 25000,
      method: MethodType.TRANSFER,
      notes: 'Pago grupal',
      file: receipt,
    })

    const [, formData] = (jwtPermissionsApi.post as jest.Mock).mock.calls[0]
    const paymentBlob = formData.get('payment') as Blob
    const paymentJson = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsText(paymentBlob)
    })
    const payment = JSON.parse(paymentJson)

    expect(payment).toEqual({
      clientDnis: [30111111, 30222222],
      expectedMonthlyFee: 25000,
      methodType: MethodType.TRANSFER,
      notes: 'Pago grupal',
    })
    expect(payment).not.toHaveProperty('createdByDni')
    expect(payment).not.toHaveProperty('amount')
    expect(payment).not.toHaveProperty('paymentStatus')
    expect(formData.get('file')).toBe(receipt)
  })

  it('createInactiveClientsPayment envía los DNIs y la cuota esperada al endpoint correcto', async () => {
    ;(jwtPermissionsApi.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      paymentId: 1,
      clientCount: 2,
    })
    await createInactiveClientsPayment([30111111, 30222222], 25000)
    expect(jwtPermissionsApi.post).toHaveBeenCalledWith('/api/payments/inactive-group', {
      clientDnis: [30111111, 30222222],
      expectedMonthlyFee: 25000,
    })
  })

  it('createInactiveClientsPayment propaga el error del backend', async () => {
    ;(jwtPermissionsApi.post as jest.Mock).mockRejectedValueOnce(new Error('cliente no elegible'))

    // Nota: no se usa `rejects.toThrow` porque en este entorno (Node 22 +
    // source-map) el matcher crashea al mapear el stack del error.
    let thrown: Error | null = null
    try {
      await createInactiveClientsPayment([30111111], 25000)
    } catch (error) {
      thrown = error as Error
    }

    expect(thrown?.message).toBe('cliente no elegible')
  })
})
