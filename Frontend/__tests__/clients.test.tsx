import ClientsPage from '@/app/clients/page'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/clients',
}))

// Mock hooks
jest.mock('@/hooks/use-client', () => ({
  useClients: () => ({
    clients: [
      { id: 1, dni: 1, firstName: 'Juan', lastName: 'Perez', email: 'a@a.com', phone: '1', age: 20, birthDate: null, address: '', role: 'CLIENT', status: 'ACTIVE', joinDate: null, activitiesCount: 0, lastActivity: null, password: '' },
      { id: 2, dni: 2, firstName: 'Ana', lastName: 'Gomez', email: 'b@b.com', phone: '2', age: 22, birthDate: null, address: '', role: 'CLIENT', status: 'INACTIVE', joinDate: null, activitiesCount: 0, lastActivity: null, password: '' },
    ],
    loading: false,
    error: null,
    loadClients: jest.fn(),
  })
}))

jest.mock('@/components/providers/auth-provider', () => {
  const actual = jest.requireActual('@/components/providers/auth-provider')
  return {
    ...actual,
    useAuth: () => ({ user: { id: 1, firstName: 'Admin', role: 'ADMIN' } }),
  }
})

// Mock notifications provider
jest.mock('@/components/providers/notifications-provider', () => {
  const actual = jest.requireActual('@/components/providers/notifications-provider')
  return {
    ...actual,
    useNotifications: () => ({
      notifications: [],
      loading: false,
      error: null,
      unreadCount: 0,
      loadNotifications: jest.fn(),
      markAsRead: jest.fn(),
      markAsUnread: jest.fn(),
      archiveNotification: jest.fn(),
      deleteNotification: jest.fn(),
      markAllAsRead: jest.fn(),
    }),
  }
})

describe('ClientsPage', () => {
  it('muestra métricas y permite filtrar para ver inactivos', async () => {
    const user = userEvent.setup()
    
    await act(async () => {
      render(<ClientsPage />)
    })

    // Métricas (permitir múltiples ocurrencias)
    expect(screen.getAllByText(/Activos/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Inactivos/i).length).toBeGreaterThan(0)

    // Lista por defecto (Activos)
    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    
    // Cambiar filtro a Inactivos y verificar
    await act(async () => {
      await user.click(screen.getAllByText(/Inactivos/i)[0])
    })
    
    expect(await screen.findByText('Ana Gomez')).toBeInTheDocument()
  })
})
