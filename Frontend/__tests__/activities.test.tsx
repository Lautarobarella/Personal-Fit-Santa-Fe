import ActivitiesPage from '@/app/activities/page'
import { act, render, screen } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/activities',
}))

const today = new Date()
const mockActivity = {
  id: 1,
  name: 'Yoga Matutino',
  description: 'Clase de yoga',
  location: 'Sala A',
  trainerName: 'Laura',
  date: today,
  duration: 60,
  participants: [],
  maxParticipants: 10,
  currentParticipants: 5,
  status: 'ACTIVE',
}

// Build week dates starting from Monday of current week
const getWeekDates = () => {
  const d = new Date(today)
  const diff = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(d)
    date.setDate(d.getDate() + i)
    return date
  })
}

const weekDates = getWeekDates()

jest.mock('@/hooks/activities/use-activities-page', () => ({
  useActivitiesPage: () => ({
    user: { id: 99, firstName: 'Carlos', role: 'ADMIN' },
    loading: false,
    searchTerm: '',
    setSearchTerm: jest.fn(),
    filterTrainer: 'all',
    setFilterTrainer: jest.fn(),
    currentWeek: weekDates[0],
    deleteDialog: { open: false, activity: null },
    setDeleteDialog: jest.fn(),
    enrollDialog: { open: false, activity: null, isEnrolled: false },
    setEnrollDialog: jest.fn(),
    attendanceDialog: { open: false, activity: null },
    setAttendanceDialog: jest.fn(),
    detailsDialog: { open: false, activity: null },
    setDetailsDialog: jest.fn(),
    canManageActivities: true,
    isTrainer: false,
    trainerFullName: 'Carlos Admin',
    weekDates,
    dayNames: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    weekActivities: [mockActivity],
    activitiesByDay: weekDates.map((date) => {
      const ad = new Date(date)
      ad.setHours(0, 0, 0, 0)
      const td = new Date(mockActivity.date)
      td.setHours(0, 0, 0, 0)
      return {
        date,
        activities: ad.getTime() === td.getTime() ? [mockActivity] : [],
      }
    }),
    trainers: ['Laura'],
    formatTime: (date: Date) =>
      new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(date)),
    formatWeekRange: () => 'Semana actual',
    isToday: (date: Date) => new Date(date).toDateString() === today.toDateString(),
    getClientActionLabel: () => 'Inscribirse',
    isClientActionDisabled: () => false,
    getClientActionVariant: () => 'default' as const,
    canSubmitSummary: () => false,
    hasSubmittedSummary: () => false,
    navigateWeek: jest.fn(),
    goToToday: jest.fn(),
    handleDeleteActivity: jest.fn(),
    handleConfirmDelete: jest.fn(),
    handleEnrollActivity: jest.fn(),
    handleConfirmEnroll: jest.fn(),
    handleAttendanceActivity: jest.fn(),
    handleDetailsClick: jest.fn(),
    handleClientPrimaryAction: jest.fn(),
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  }),
}))

// Mock sub-components with complex dependencies
jest.mock('@/components/activities/attendance-activity-dialog', () => ({
  AttendanceActivityDialog: () => null,
}))
jest.mock('@/components/activities/delete-activity-dialog', () => ({
  DeleteActivityDialog: () => null,
}))
jest.mock('@/components/activities/details-activity-dialog', () => ({
  DetailsActivityDialog: () => null,
}))
jest.mock('@/components/activities/enroll-activity-dialog', () => ({
  EnrollActivityDialog: () => null,
}))
jest.mock('@/components/ui/bottom-nav', () => ({
  BottomNav: () => null,
}))
jest.mock('@/components/ui/mobile-header', () => ({
  MobileHeader: ({ title }: { title: string }) => <div data-testid="mobile-header">{title}</div>,
}))

describe('ActivitiesPage', () => {
  it('lista actividades de la semana', async () => {
    await act(async () => {
      render(<ActivitiesPage />)
    })
    expect(screen.getByText('Yoga Matutino')).toBeInTheDocument()
  })
})