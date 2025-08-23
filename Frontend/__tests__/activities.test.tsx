// import ActivitiesPage from '@/app/activities/page'
// import { EnrollmentStatus } from '@/lib/types'
// import { act, render, screen } from '@testing-library/react'

// jest.mock('next/navigation', () => ({
//   useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
//   usePathname: () => '/activities',
// }))

// jest.mock('@/hooks/use-activity', () => ({
//   useActivities: () => ({
//     allActivities: [
//       {
//         id: 1,
//         name: 'Yoga Matutino',
//         description: 'Clase de yoga',
//         location: 'Sala A',
//         trainerName: 'Laura',
//         date: new Date(),
//         duration: 60,
//         participants: [],
//         maxParticipants: 10,
//         currentParticipants: 5,
//         status: 'ACTIVE',
//       },
//     ],
//     activities: [], // Mantenemos por compatibilidad
//     loading: false,
//     error: null,
//     refreshActivities: jest.fn(),
//     loadActivitiesByWeek: jest.fn(),
//     enrollInActivity: jest.fn(),
//     unenrollFromActivity: jest.fn(),
//     removeActivity: jest.fn(),
//     isUserEnrolled: () => false,
//     getUserEnrollmentStatus: () => EnrollmentStatus.NOT_ENROLLED,
//     getActivitiesByWeek: jest.fn(() => [
//       {
//         id: 1,
//         name: 'Yoga Matutino',
//         description: 'Clase de yoga',
//         location: 'Sala A',
//         trainerName: 'Laura',
//         date: new Date(),
//         duration: 60,
//         participants: [],
//         maxParticipants: 10,
//         currentParticipants: 5,
//         status: 'ACTIVE',
//       },
//     ]),
//     getTodayActivities: jest.fn(() => []),
//   })
// }))

// jest.mock('@/hooks/use-client', () => ({
//   useClients: () => ({
//     checkMembershipStatus: jest.fn().mockResolvedValue(true),
//   })
// }))

// jest.mock('@/components/providers/auth-provider', () => {
//   const actual = jest.requireActual('@/components/providers/auth-provider')
//   return {
//     ...actual,
//     useAuth: () => ({ user: { id: 99, firstName: 'Carlos', role: 'ADMIN' } }),
//   }
// })

// // Mock notifications provider
// jest.mock('@/components/providers/notifications-provider', () => {
//   const actual = jest.requireActual('@/components/providers/notifications-provider')
//   return {
//     ...actual,
//     useNotifications: () => ({
//       notifications: [],
//       loading: false,
//       error: null,
//       unreadCount: 0,
//       loadNotifications: jest.fn(),
//       markAsRead: jest.fn(),
//       markAsUnread: jest.fn(),
//       archiveNotification: jest.fn(),
//       deleteNotification: jest.fn(),
//       markAllAsRead: jest.fn(),
//     }),
//   }
// })

// describe('ActivitiesPage', () => {
//   it('lista actividades de la semana', async () => {
//     await act(async () => {
//       render(<ActivitiesPage />)
//     })
//     expect(screen.getByText('Yoga Matutino')).toBeInTheDocument()
//   })
// })