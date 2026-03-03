import PaymentsPage from '@/app/payments/page'
import { act, render, screen } from '@testing-library/react'

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/payments',
}))

// Mock the composite page hook that the component actually uses
jest.mock('@/hooks/payments/use-payments-page', () => ({
  usePaymentsPage: () => ({
    user: { id: 1, firstName: 'Admin', role: 'ADMIN' },
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    searchTerm: '',
    setSearchTerm: jest.fn(),
    showRevenue: true,
    setShowRevenue: jest.fn(),
    selectedYear: 2026,
    selectedMonth: 3,
    isLoadingAdminPayments: false,
    verificationDialog: { open: false, paymentId: null },
    setVerificationDialog: jest.fn(),
    detailsDialog: { open: false, paymentId: null },
    setDetailsDialog: jest.fn(),
    sortedAllPayments: [
      {
        id: 1,
        clientId: 10,
        clientName: 'Juan Perez',
        amount: 25000,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        method: 'CASH',
      },
      {
        id: 2,
        clientId: 11,
        clientName: 'Ana Gomez',
        amount: 25000,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PAID',
        method: 'CARD',
      },
    ],
    pendingPayments: [
      {
        id: 1,
        clientId: 10,
        clientName: 'Juan Perez',
        amount: 25000,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        method: 'CASH',
      },
    ],
    totalRevenue: 50000,
    activePayment: null,
    pendingPayment: null,
    canCreateNewPayment: true,
    formatDate: (date: Date | string | null) => {
      if (!date) return ''
      return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(date),
      )
    },
    getStatusColor: (status: string) => (status === 'PAID' ? 'success' : 'warning'),
    getStatusText: (status: string) => (status === 'PAID' ? 'Pagado' : 'Pendiente'),
    formatCurrency: (amount: number) =>
      new Intl.NumberFormat('es-AR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        amount,
      ),
    getMethodText: (method: string) => (method === 'CASH' ? 'Efectivo' : 'Tarjeta'),
    handleVerificationClick: jest.fn(),
    handleDetailsClick: jest.fn(),
    handleMonthChange: jest.fn(),
    handleYearChange: jest.fn(),
    getCurrentDateInfo: () => ({ currentYear: 2026, currentMonth: 3 }),
  }),
}))

// Mock sub-components that have their own complex dependencies
jest.mock('@/components/payments/payment-details-dialog', () => ({
  PaymentDetailsDialog: () => null,
}))
jest.mock('@/components/payments/payment-verification-dialog', () => ({
  PaymentVerificationDialog: () => null,
}))
jest.mock('@/components/ui/bottom-nav', () => ({
  BottomNav: () => null,
}))
jest.mock('@/components/ui/mobile-header', () => ({
  MobileHeader: ({ title }: { title: string }) => <div data-testid="mobile-header">{title}</div>,
}))

describe('PaymentsPage', () => {
  it('muestra conteos de pagos pendientes y lista elementos clave', async () => {
    await act(async () => {
      render(<PaymentsPage />)
    })

    // Tab headers
    expect(await screen.findByText(/Pendientes/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Todos/i })).toBeInTheDocument()

    // Renderiza pagos
    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    expect(screen.getByText('Ana Gomez')).toBeInTheDocument()

    // Muestra badge de estado
    expect(screen.getAllByText(/Pendiente|Pagado/).length).toBeGreaterThan(0)
  })
})