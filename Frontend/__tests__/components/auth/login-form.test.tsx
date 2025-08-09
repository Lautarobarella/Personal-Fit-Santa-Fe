import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginForm } from '@/components/auth/login-form'

// Mock next/router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock the auth API
jest.mock('@/api/JWTAuth/api', () => ({
  authAPI: {
    login: jest.fn(),
  },
}))

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

import { authAPI } from '@/api/JWTAuth/api'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

const renderWithQueryClient = (component: React.ReactElement) => {
  const testQueryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={testQueryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
  })

  it('renders login form correctly', () => {
    renderWithQueryClient(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email es requerido/i)).toBeInTheDocument()
      expect(screen.getByText(/contraseña es requerida/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup()
    const mockLoginResponse = {
      token: 'fake-jwt-token',
      refreshToken: 'fake-refresh-token',
      user: {
        id: 1,
        email: 'test@personalfit.com',
        name: 'Test User',
        role: 'CLIENT',
      },
    }

    ;(authAPI.login as jest.Mock).mockResolvedValueOnce(mockLoginResponse)

    renderWithQueryClient(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    
    await user.type(emailInput, 'test@personalfit.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'test@personalfit.com',
        password: 'password123',
      })
    })
  })

  it('handles login error', async () => {
    const user = userEvent.setup()
    const mockError = new Error('Invalid credentials')
    ;(authAPI.login as jest.Mock).mockRejectedValueOnce(mockError)

    renderWithQueryClient(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    
    await user.type(emailInput, 'test@personalfit.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalled()
    })
  })

  it('disables form during submission', async () => {
    const user = userEvent.setup()
    ;(authAPI.login as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    )

    renderWithQueryClient(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    
    await user.type(emailInput, 'test@personalfit.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    expect(submitButton).toBeDisabled()
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    ;(authAPI.login as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    )

    renderWithQueryClient(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    
    await user.type(emailInput, 'test@personalfit.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  it('clears form after successful login', async () => {
    const user = userEvent.setup()
    const mockLoginResponse = {
      token: 'fake-jwt-token',
      refreshToken: 'fake-refresh-token',
      user: {
        id: 1,
        email: 'test@personalfit.com',
        name: 'Test User',
        role: 'CLIENT',
      },
    }

    ;(authAPI.login as jest.Mock).mockResolvedValueOnce(mockLoginResponse)

    renderWithQueryClient(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    
    await user.type(emailInput, 'test@personalfit.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(emailInput.value).toBe('')
      expect(passwordInput.value).toBe('')
    })
  })
})
