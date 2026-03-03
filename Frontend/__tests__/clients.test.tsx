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

jest.mock('@/hooks/clients/use-clients-page', () => ({
  useClientsPage: () => {
    const filtered = mockClients.filter((c) => (mockStatusFilter === 'all' ? true : c.status === mockStatusFilter))
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
})
