import { jwtPermissionsApi } from '@/api/JWTAuth/api'
import {
  fetchActivities,
  fetchActivitiesByDate,
  fetchActivityDetail,
  newActivity,
  editActivityBack,
  deleteActivity,
  enrollActivity,
  unenrollActivity,
  isUserEnrolled,
  fetchTrainers,
} from '@/api/activities/activitiesApi'
import { AttendanceStatus } from '@/types'

jest.mock('@/api/JWTAuth/api', () => ({
  jwtPermissionsApi: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

jest.mock('@/lib/error-handler', () => ({
  handleApiError: jest.fn(),
  handleValidationError: jest.fn(),
  isValidationError: jest.fn(() => false),
}))

describe('activitiesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchActivities', () => {
    it('llama GET /api/activities/getAll', async () => {
      const mockActivities = [
        { id: 1, name: 'Yoga', status: 'ACTIVE' },
        { id: 2, name: 'Pilates', status: 'ACTIVE' },
      ]
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockActivities)

      const result = await fetchActivities()

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/activities/getAll')
      expect(result).toHaveLength(2)
    })

    it('retorna array vacio si la API falla', async () => {
      ;(jwtPermissionsApi.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchActivities()

      expect(result).toEqual([])
    })
  })

  describe('fetchActivitiesByDate', () => {
    it('llama GET /api/activities/getAllByWeek/{date}', async () => {
      const mockActivities = [{ id: 1, name: 'Spinning' }]
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockActivities)

      const testDate = new Date('2026-03-03')
      const result = await fetchActivitiesByDate(testDate)

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/activities/getAllByWeek/')
      )
      expect(result).toHaveLength(1)
    })
  })

  describe('fetchActivityDetail', () => {
    it('llama GET /api/activities/{id}', async () => {
      const mockDetail = { id: 1, name: 'Yoga', description: 'Clase de yoga', maxParticipants: 15 }
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockDetail)

      const result = await fetchActivityDetail(1)

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/activities/1')
      expect(result.name).toBe('Yoga')
    })
  })

  describe('newActivity', () => {
    it('llama POST /api/activities/new', async () => {
      const mockResponse = { success: true, message: 'Activity created' }
      ;(jwtPermissionsApi.post as jest.Mock).mockResolvedValueOnce(mockResponse)

      const activity = {
        name: 'Yoga',
        description: 'Clase de yoga',
        location: 'Sala A',
        trainerId: '1',
        date: '2026-03-03',
        time: '09:00',
        duration: '60',
        maxParticipants: '15',
        isRecurring: false,
      }

      await newActivity(activity)

      expect(jwtPermissionsApi.post).toHaveBeenCalledWith('/api/activities/new', activity)
    })
  })

  describe('editActivityBack', () => {
    it('llama PUT /api/activities/{id}', async () => {
      const mockResponse = { success: true }
      ;(jwtPermissionsApi.put as jest.Mock).mockResolvedValueOnce(mockResponse)

      const activity = {
        id: '1',
        name: 'Yoga Avanzado',
        description: 'Clase avanzada',
        location: 'Sala B',
        trainerId: '2',
        date: '2026-03-04',
        time: '10:00',
        duration: '90',
        maxParticipants: '20',
        isRecurring: false,
      }

      await editActivityBack(activity)

      expect(jwtPermissionsApi.put).toHaveBeenCalledWith('/api/activities/1', activity)
    })
  })

  describe('deleteActivity', () => {
    it('llama DELETE /api/activities/{id}', async () => {
      const mockResponse = { success: true }
      ;(jwtPermissionsApi.delete as jest.Mock).mockResolvedValueOnce(mockResponse)

      await deleteActivity(1)

      expect(jwtPermissionsApi.delete).toHaveBeenCalledWith('/api/activities/1')
    })
  })

  describe('enrollActivity', () => {
    it('llama POST /api/activities/enroll', async () => {
      const mockResponse = { success: true, message: 'Enrolled' }
      ;(jwtPermissionsApi.post as jest.Mock).mockResolvedValueOnce(mockResponse)

      const request = { activityId: 1, userId: 10, status: AttendanceStatus.PENDING, createdAt: new Date('2026-03-03') }
      await enrollActivity(request)

      expect(jwtPermissionsApi.post).toHaveBeenCalledWith('/api/activities/enroll', request)
    })
  })

  describe('unenrollActivity', () => {
    it('llama POST /api/activities/unenroll', async () => {
      const mockResponse = { success: true, message: 'Unenrolled' }
      ;(jwtPermissionsApi.post as jest.Mock).mockResolvedValueOnce(mockResponse)

      const request = { activityId: 1, userId: 10, status: AttendanceStatus.PENDING, createdAt: new Date('2026-03-03') }
      await unenrollActivity(request)

      expect(jwtPermissionsApi.post).toHaveBeenCalledWith('/api/activities/unenroll', request)
    })
  })

  describe('isUserEnrolled', () => {
    it('retorna true cuando el usuario esta inscripto', async () => {
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(true)

      const result = await isUserEnrolled(1, 10)

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/activities/1/enrolled/10')
      expect(result).toBe(true)
    })

    it('retorna false cuando el usuario no esta inscripto', async () => {
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(false)

      const result = await isUserEnrolled(1, 10)

      expect(result).toBe(false)
    })
  })

  describe('fetchTrainers', () => {
    it('llama GET /api/users/trainers', async () => {
      const mockTrainers = [
        { id: 5, firstName: 'Laura', lastName: 'Garcia' },
      ]
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockTrainers)

      const result = await fetchTrainers()

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/users/trainers')
      expect(result).toHaveLength(1)
    })
  })
})
