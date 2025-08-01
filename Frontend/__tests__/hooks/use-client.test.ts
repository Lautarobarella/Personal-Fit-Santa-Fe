import { act, renderHook } from '@testing-library/react'
import { useClient } from '@/hooks/use-client'

// Mock the API calls
jest.mock('@/api/clients/clientsApi', () => ({
  getClients: jest.fn(),
  getClientById: jest.fn(),
  createClient: jest.fn(),
  updateClient: jest.fn(),
  deleteClient: jest.fn(),
}))

describe('useClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useClient())

    expect(result.current.clients).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should fetch clients successfully', async () => {
    const mockClients = [
      { id: 1, firstName: 'John', lastName: 'Doe' },
      { id: 2, firstName: 'Jane', lastName: 'Smith' },
    ]

    const { getClients } = require('@/api/clients/clientsApi')
    getClients.mockResolvedValue(mockClients)

    const { result } = renderHook(() => useClient())

    await act(async () => {
      await result.current.fetchClients()
    })

    expect(result.current.clients).toEqual(mockClients)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle fetch error', async () => {
    const mockError = new Error('Failed to fetch clients')
    const { getClients } = require('@/api/clients/clientsApi')
    getClients.mockRejectedValue(mockError)

    const { result } = renderHook(() => useClient())

    await act(async () => {
      await result.current.fetchClients()
    })

    expect(result.current.error).toBe(mockError.message)
    expect(result.current.loading).toBe(false)
  })
}) 