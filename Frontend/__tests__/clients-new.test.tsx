import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewClientPage from '@/app/clients/new/page'

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/clients/new',
}))

// Mock client form hook
const mockHandleSubmit = jest.fn((e: any) => e.preventDefault())
const mockHandleInputChange = jest.fn()

jest.mock('@/hooks/clients/use-client-form', () => ({
  useClientForm: () => ({
    user: { id: 1, firstName: 'Admin', role: 'ADMIN' },
    router: { push: jest.fn(), back: jest.fn() },
    isLoading: false,
    form: {
      dni: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      emergencyPhone: '',
      birthDate: '',
      address: '',
      role: 'CLIENT',
      joinDate: new Date().toISOString().split('T')[0],
      password: '',
    },
    errors: {},
    handleSubmit: mockHandleSubmit,
    handleInputChange: mockHandleInputChange,
  }),
}))

jest.mock('@/contexts/auth-provider', () => ({
  useAuth: () => ({ user: { id: 1, firstName: 'Admin', role: 'ADMIN' } }),
}))

jest.mock('@/contexts/notifications-provider', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
  }),
}))

jest.mock('@/hooks/notifications/use-notification', () => ({
  useNotification: () => ({
    notifications: [],
    unreadCount: 0,
  }),
}))

describe('NewClientPage', () => {
  it('muestra formulario de registro de nuevo cliente', async () => {
    await act(async () => {
      render(<NewClientPage />)
    })

    expect(screen.getByText('Registrar Nuevo Cliente')).toBeInTheDocument()
    expect(screen.getByText('Información Personal')).toBeInTheDocument()
  })

  it('muestra campos de formulario requeridos', async () => {
    await act(async () => {
      render(<NewClientPage />)
    })

    // Verify key form labels exist
    expect(screen.getByText(/DNI/i)).toBeInTheDocument()
    expect(screen.getByText(/Nombre/i)).toBeInTheDocument()
    expect(screen.getByText(/Email/i)).toBeInTheDocument()
  })

  it('muestra mensaje de permisos cuando el usuario no es ADMIN', async () => {
    // Override the mock for this test
    const useClientForm = require('@/hooks/clients/use-client-form')
    const originalMock = useClientForm.useClientForm

    useClientForm.useClientForm = () => ({
      ...originalMock(),
      user: { id: 2, firstName: 'Client', role: 'CLIENT' },
    })

    await act(async () => {
      render(<NewClientPage />)
    })

    expect(screen.getByText('No tienes permisos para crear clientes')).toBeInTheDocument()

    // Restore
    useClientForm.useClientForm = originalMock
  })
})
