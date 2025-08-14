import PaymentsPage from '@/app/payments/page'
import { AuthProvider } from '@/components/providers/auth-provider'
import { render, screen } from '@testing-library/react'

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/payments',
}))

// Mock React Query provider wrapper
const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
  const { QueryClient, QueryClientProvider } = require('@tanstack/react-query')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

// Mock usePayment hook to control data
jest.mock('@/hooks/use-payment', () => ({
  usePayment: () => ({
    payments: [
      {
        id: 1,
        clientId: 10,
        clientName: 'Juan Perez',
        amount: 25000,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        status: 'PENDING',
        method: 'CASH',
      },
      {
        id: 2,
        clientId: 11,
        clientName: 'Ana Gomez',
        amount: 25000,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        status: 'PAID',
        method: 'CARD',
      },
    ],
    updatePaymentStatus: jest.fn(),
    isLoading: false,
  })
}))

// Minimal mock auth context
jest.mock('@/components/providers/auth-provider', () => {
  const actual = jest.requireActual('@/components/providers/auth-provider')
  return {
    ...actual,
    useAuth: () => ({ user: { id: 1, firstName: 'Admin', role: 'ADMIN' } }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

describe('PaymentsPage', () => {
  it('muestra conteos de pagos pendientes y lista elementos clave', async () => {
    render(
      <ReactQueryProvider>
        <AuthProvider>
          <PaymentsPage />
        </AuthProvider>
      </ReactQueryProvider>
    )

    // Tab headers
    expect(await screen.findByText(/Pendientes/i)).toBeInTheDocument()
    expect(screen.getByText(/Todos/i)).toBeInTheDocument()

    // Renderiza pagos
    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    expect(screen.getByText('Ana Gomez')).toBeInTheDocument()

    // Muestra badge de estado
    expect(screen.getAllByText(/Pendiente|Pagado/).length).toBeGreaterThan(0)
  })
})


