import { CreateInactivePaymentsDialog } from '@/components/clients/create-inactive-payments-dialog'
import { UserType } from '@/types'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const buildClient = (overrides: Partial<UserType>): UserType =>
  ({
    id: 1,
    dni: 30111111,
    firstName: 'Ana',
    lastName: 'Gomez',
    email: 'a@a.com',
    phone: '1',
    age: 22,
    birthDate: null,
    address: '',
    role: 'CLIENT',
    status: 'INACTIVE',
    joinDate: null,
    activitiesCount: 0,
    lastActivity: null,
    password: '',
    ...overrides,
  }) as UserType

const clients = [
  buildClient({ id: 1, dni: 30111111, firstName: 'Ana', lastName: 'Gomez' }),
  buildClient({ id: 2, dni: 30222222, firstName: 'Juan', lastName: 'Perez' }),
]

describe('CreateInactivePaymentsDialog', () => {
  it('lista los clientes seleccionados con su DNI y el total a generar', () => {
    render(
      <CreateInactivePaymentsDialog
        open
        onOpenChange={jest.fn()}
        clients={clients}
        monthlyFee={25000}
        isSubmitting={false}
        onConfirm={jest.fn()}
      />,
    )

    expect(screen.getByText('Ana Gomez')).toBeInTheDocument()
    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    expect(screen.getByText('DNI 30111111')).toBeInTheDocument()
    expect(screen.getByText('DNI 30222222')).toBeInTheDocument()
    expect(screen.getByText(/total \$50\.000/i)).toBeInTheDocument()
  })

  it('Cancelar cierra el diálogo sin confirmar', async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    const onConfirm = jest.fn()

    render(
      <CreateInactivePaymentsDialog
        open
        onOpenChange={onOpenChange}
        clients={clients}
        monthlyFee={25000}
        isSubmitting={false}
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Cancelar/i }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('Confirmar ejecuta la creación de pagos', async () => {
    const user = userEvent.setup()
    const onConfirm = jest.fn()

    render(
      <CreateInactivePaymentsDialog
        open
        onOpenChange={jest.fn()}
        clients={clients}
        monthlyFee={25000}
        isSubmitting={false}
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Confirmar/i }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('bloquea la confirmación cuando la cuota mensual no está disponible', () => {
    render(
      <CreateInactivePaymentsDialog
        open
        onOpenChange={jest.fn()}
        clients={clients}
        monthlyFee={0}
        isSubmitting={false}
        onConfirm={jest.fn()}
      />,
    )

    expect(screen.getByText(/No se pudo obtener la cuota mensual/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirmar/i })).toBeDisabled()
  })

  it('bloquea los botones mientras se envía para evitar doble confirmación', () => {
    render(
      <CreateInactivePaymentsDialog
        open
        onOpenChange={jest.fn()}
        clients={clients}
        monthlyFee={25000}
        isSubmitting
        onConfirm={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /Confirmar/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeDisabled()
  })
})
