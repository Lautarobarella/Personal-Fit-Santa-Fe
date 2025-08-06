import { LoginForm } from '@/components/auth/login-form'
import { render, screen } from '@testing-library/react'

// Mock the auth provider
jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: () => ({
    login: jest.fn().mockResolvedValue(true),
    user: null,
    isLoading: false,
  }),
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe('LoginForm', () => {
  it('renders login form', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('renders form with correct structure', () => {
    render(<LoginForm />)
    
    // Check for form elements
    expect(screen.getByPlaceholderText(/tu@email\.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument()
    expect(screen.getByText(/ingresa a tu cuenta para continuar/i)).toBeInTheDocument()
  })
}) 