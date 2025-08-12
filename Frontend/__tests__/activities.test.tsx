import ActivitiesPage from '@/app/activities/page'
import { render, screen } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/activities',
}))

jest.mock('@/hooks/use-activity', () => ({
  useActivities: () => ({
    activities: [
      {
        id: 1,
        name: 'Yoga Matutino',
        description: 'Clase de yoga',
        location: 'Sala A',
        trainerName: 'Laura',
        date: new Date(),
        duration: 60,
        participants: [],
        maxParticipants: 10,
        currentParticipants: 5,
        status: 'ACTIVE',
      },
    ],
    loading: false,
    error: null,
    loadActivitiesByWeek: jest.fn(),
    enrollIntoActivity: jest.fn(),
    unenrollFromActivity: jest.fn(),
    deleteActivityById: jest.fn(),
    isUserEnrolled: () => false,
    getUserEnrollmentStatus: () => 'PENDING',
  })
}))

jest.mock('@/components/providers/auth-provider', () => {
  const actual = jest.requireActual('@/components/providers/auth-provider')
  return {
    ...actual,
    useAuth: () => ({ user: { id: 99, firstName: 'Carlos', role: 'ADMIN' } }),
  }
})

describe('ActivitiesPage', () => {
  it('lista actividades de la semana', () => {
    render(<ActivitiesPage />)
    expect(screen.getByText('Yoga Matutino')).toBeInTheDocument()
  })
})


