import { act, renderHook } from '@testing-library/react'
import { useClients } from '@/hooks/use-client'

// Mock the API calls
jest.mock('@/api/clients/usersApi', () => ({
  fetchUsers: jest.fn(),
  fetchUserDetail: jest.fn(),
  createUser: jest.fn(),
}))

jest.mock('@/api/payment/paymentsApi', () => ({
  fetchPaymentsById: jest.fn(),
}))

describe('useClients', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useClients())

    expect(result.current.clients).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should fetch clients successfully', async () => {
    const mockClients = [
      { id: 1, firstName: 'John', lastName: 'Doe' },
      { id: 2, firstName: 'Jane', lastName: 'Smith' },
    ]

    const { fetchUsers } = require('@/api/clients/usersApi')
    fetchUsers.mockResolvedValue(mockClients)

    const { result } = renderHook(() => useClients())

    await act(async () => {
      await result.current.loadClients()
    })

    expect(result.current.clients).toEqual(mockClients)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle fetch error', async () => {
    const mockError = new Error('Failed to fetch clients')
    const { fetchUsers } = require('@/api/clients/usersApi')
    fetchUsers.mockRejectedValue(mockError)

    const { result } = renderHook(() => useClients())

    await act(async () => {
      await result.current.loadClients()
    })

    expect(result.current.error).toBe('Error al cargar los clientes')
    expect(result.current.loading).toBe(false)
  })
}) 