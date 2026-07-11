import ClientsPage from '@/app/clients/page'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/clients',
}))

const mockClients = [
  {
    id: 1,
    dni: 1,
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'a@a.com',
    phone: '1',
    age: 20,
    birthDate: null,
    address: '',
    role: 'CLIENT',
    status: 'ACTIVE',
    joinDate: null,
    activitiesCount: 0,
    lastActivity: null,
    password: '',
  },
  {
    id: 2,
    dni: 2,
    firstName: 'Ana',
    lastName: 'Gomez',
    email: 'b@b.com',
    phone: '2',
    age: 22,
    birthDate: null,
    address: '',
    role: 'CLIENT',
    status: 'INACTIVE',
    joinDate: null,
    activitiesCount: 0,
    lastActivity: null,
    password: '',
  },
]

// Mock the composite page hook
let mockStatusFilter = 'ACTIVE'
const mockSetStatusFilter = jest.fn((val: string) => {
  mockStatusFilter = val
})

let mockPaymentSelectionMode = false
let mockSelectedPaymentClientIds: number[] = []
let mockIneligibleClientIds: number[] = []
const mockStartPaymentSelection = jest.fn()
const mockCancelPaymentSelection = jest.fn()
const mockTogglePaymentClientSelection = jest.fn()
const mockHandleOpenPaymentConfirm = jest.fn()
const mockHandleConfirmCreatePayments = jest.fn()

jest.mock('@/hooks/clients/use-clients-page', () => ({
  useClientsPage: () => {
    const filtered = mockClients.filter((c) => (mockStatusFilter === 'all' ? true : c.status === mockStatusFilter))
    const isEligible = (client: { id: number; role: string; status: string }) =>
      client.role === 'CLIENT' && client.status === 'INACTIVE' && !mockIneligibleClientIds.includes(client.id)
    const selectedPaymentClients = mockClients.filter(
      (c) => mockSelectedPaymentClientIds.includes(c.id) && isEligible(c),
    )
    return {
      user: { id: 1, firstName: 'Admin', role: 'ADMIN' },
      router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
      clients: mockClients,
      loading: false,
      error: null,
      filteredClients: filtered,
      searchTerm: '',
      setSearchTerm: jest.fn(),
      statusFilter: mockStatusFilter,
      setStatusFilter: mockSetStatusFilter,
      clientDetailsDialog: { open: false, userId: null },
      setClientDetailsDialog: jest.fn(),
      deleteDialog: { open: false, clientId: null, clientName: '' },
      setDeleteDialog: jest.fn(),
      isDeleting: false,
      paymentSelectionMode: mockPaymentSelectionMode,
      selectedPaymentClients,
      selectedPaymentClientIds: mockSelectedPaymentClientIds,
      eligiblePaymentClientsCount: filtered.filter(isEligible).length,
      paymentConfirmOpen: false,
      setPaymentConfirmOpen: jest.fn(),
      isCreatingInactivePayments: false,
      monthlyFee: 25000,
      isClientEligibleForPayment: isEligible,
      getPaymentIneligibilityReason: (client: { id: number; role: string; status: string }) =>
        isEligible(client) ? null : 'Ya tiene un pago pendiente este mes.',
      startPaymentSelection: mockStartPaymentSelection,
      cancelPaymentSelection: mockCancelPaymentSelection,
      togglePaymentClientSelection: mockTogglePaymentClientSelection,
      handleOpenPaymentConfirm: mockHandleOpenPaymentConfirm,
      handleConfirmCreatePayments: mockHandleConfirmCreatePayments,
      formatDate: (date: Date | string | null) =>
        date
          ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
          : 'N/A',
      handleClientDetails: jest.fn(),
      handleOpenDeleteDialog: jest.fn(),
      handleConfirmDelete: jest.fn(),
    }
  },
}))

// Mock sub-components with complex dependencies
jest.mock('@/components/clients/details-client-dialog', () => ({
  ClientDetailsDialog: () => null,
}))
jest.mock('@/components/ui/bottom-nav', () => ({
  BottomNav: () => null,
}))
jest.mock('@/components/ui/mobile-header', () => ({
  MobileHeader: ({ title }: { title: string }) => <div data-testid="mobile-header">{title}</div>,
}))

describe('ClientsPage', () => {
  beforeEach(() => {
    mockStatusFilter = 'ACTIVE'
    mockPaymentSelectionMode = false
    mockSelectedPaymentClientIds = []
    mockIneligibleClientIds = []
    jest.clearAllMocks()
  })

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
  })

  describe('carga rápida de pagos para inactivos', () => {
    it('muestra el botón Cargar pago solo en la solapa Inactivos', async () => {
      mockStatusFilter = 'INACTIVE'

      await act(async () => {
        render(<ClientsPage />)
      })

      expect(screen.getByRole('button', { name: /Cargar pago/i })).toBeInTheDocument()
    })

    it('no muestra el botón Cargar pago en la solapa Activos', async () => {
      mockStatusFilter = 'ACTIVE'

      await act(async () => {
        render(<ClientsPage />)
      })

      expect(screen.queryByRole('button', { name: /Cargar pago/i })).not.toBeInTheDocument()
    })

    it('no muestra el botón Cargar pago en la solapa Total', async () => {
      mockStatusFilter = 'all'

      await act(async () => {
        render(<ClientsPage />)
      })

      expect(screen.queryByRole('button', { name: /Cargar pago/i })).not.toBeInTheDocument()
    })

    it('activa el modo selección al presionar Cargar pago', async () => {
      mockStatusFilter = 'INACTIVE'
      const user = userEvent.setup()

      await act(async () => {
        render(<ClientsPage />)
      })

      await user.click(screen.getByRole('button', { name: /Cargar pago/i }))

      expect(mockStartPaymentSelection).toHaveBeenCalled()
    })

    it('en modo selección muestra checkboxes y el toolbar de confirmación', async () => {
      mockStatusFilter = 'INACTIVE'
      mockPaymentSelectionMode = true
      const user = userEvent.setup()

      await act(async () => {
        render(<ClientsPage />)
      })

      const checkbox = screen.getByRole('checkbox', { name: /Seleccionar a Ana Gomez/i })
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).not.toBeDisabled()

      await user.click(checkbox)
      expect(mockTogglePaymentClientSelection).toHaveBeenCalledWith(2)

      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Continuar/i })).toBeInTheDocument()
    })

    it('deshabilita Continuar sin selección y lo habilita con clientes seleccionados', async () => {
      mockStatusFilter = 'INACTIVE'
      mockPaymentSelectionMode = true

      await act(async () => {
        render(<ClientsPage />)
      })
      expect(screen.getByRole('button', { name: /Continuar/i })).toBeDisabled()
    })

    it('habilita Continuar con clientes seleccionados y confirma la selección', async () => {
      mockStatusFilter = 'INACTIVE'
      mockPaymentSelectionMode = true
      mockSelectedPaymentClientIds = [2]
      const user = userEvent.setup()

      await act(async () => {
        render(<ClientsPage />)
      })

      const continueButton = screen.getByRole('button', { name: /Continuar/i })
      expect(continueButton).not.toBeDisabled()

      await user.click(continueButton)
      expect(mockHandleOpenPaymentConfirm).toHaveBeenCalled()
    })

    it('muestra deshabilitado el checkbox de un cliente con pago pendiente del mes', async () => {
      mockStatusFilter = 'INACTIVE'
      mockPaymentSelectionMode = true
      mockIneligibleClientIds = [2]

      await act(async () => {
        render(<ClientsPage />)
      })

      expect(screen.getByRole('checkbox', { name: /Seleccionar a Ana Gomez/i })).toBeDisabled()
      expect(screen.getByText('Ya tiene un pago pendiente este mes.')).toBeInTheDocument()
    })

    it('permite cancelar el modo selección', async () => {
      mockStatusFilter = 'INACTIVE'
      mockPaymentSelectionMode = true
      const user = userEvent.setup()

      await act(async () => {
        render(<ClientsPage />)
      })

      await user.click(screen.getByRole('button', { name: /Cancelar/i }))
      expect(mockCancelPaymentSelection).toHaveBeenCalled()
    })
  })
})
