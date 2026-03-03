import { jwtPermissionsApi } from '@/api/JWTAuth/api'
import {
  fetchActivityAttendances,
  fetchActivityAttendancesWithUserInfo,
  fetchUserAttendances,
  updateAttendanceStatus,
  enrollUserInActivity,
  unenrollUserFromActivity,
  checkUserEnrollment,
} from '@/api/attendance/attendanceApi'
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

describe('attendanceApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchActivityAttendances', () => {
    it('llama GET /api/attendance/activity/{activityId}', async () => {
      const mockAttendances = [
        { id: 1, userId: 10, status: 'PRESENT' },
        { id: 2, userId: 11, status: 'PENDING' },
      ]
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockAttendances)

      const result = await fetchActivityAttendances(100)

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/attendance/activity/100')
      expect(result).toHaveLength(2)
    })
  })

  describe('fetchActivityAttendancesWithUserInfo', () => {
    it('llama GET /api/attendance/activity/{id}/with-user-info', async () => {
      const mockData = [
        { id: 1, userId: 10, firstName: 'Juan', lastName: 'Perez', status: 'PRESENT' },
      ]
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(mockData)

      const result = await fetchActivityAttendancesWithUserInfo(100)

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith(
        '/api/attendance/activity/100/with-user-info'
      )
      expect(result[0].firstName).toBe('Juan')
    })
  })

  describe('fetchUserAttendances', () => {
    it('llama GET /api/attendance/user/{userId}', async () => {
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce([])

      await fetchUserAttendances(10)

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith('/api/attendance/user/10')
    })
  })

  describe('updateAttendanceStatus', () => {
    it('llama PUT /api/attendance/{id}/status', async () => {
      const mockResponse = { success: true }
      ;(jwtPermissionsApi.put as jest.Mock).mockResolvedValueOnce(mockResponse)

      await updateAttendanceStatus(1, AttendanceStatus.PRESENT)

      expect(jwtPermissionsApi.put).toHaveBeenCalledWith('/api/attendance/1/status', {
        status: 'PRESENT',
      })
    })

    it('maneja el status LATE correctamente', async () => {
      ;(jwtPermissionsApi.put as jest.Mock).mockResolvedValueOnce({ success: true })

      await updateAttendanceStatus(2, AttendanceStatus.LATE)

      expect(jwtPermissionsApi.put).toHaveBeenCalledWith('/api/attendance/2/status', {
        status: 'LATE',
      })
    })
  })

  describe('enrollUserInActivity', () => {
    it('llama POST /api/attendance/enroll/{userId}/{activityId}', async () => {
      const mockAttendance = { id: 5, userId: 10, activityId: 100, status: 'PENDING' }
      ;(jwtPermissionsApi.post as jest.Mock).mockResolvedValueOnce(mockAttendance)

      const result = await enrollUserInActivity(10, 100)

      expect(jwtPermissionsApi.post).toHaveBeenCalledWith('/api/attendance/enroll/10/100', {})
      expect(result.status).toBe('PENDING')
    })
  })

  describe('unenrollUserFromActivity', () => {
    it('llama DELETE /api/attendance/unenroll/{userId}/{activityId}', async () => {
      ;(jwtPermissionsApi.delete as jest.Mock).mockResolvedValueOnce({ success: true })

      await unenrollUserFromActivity(10, 100)

      expect(jwtPermissionsApi.delete).toHaveBeenCalledWith(
        '/api/attendance/unenroll/10/100'
      )
    })
  })

  describe('checkUserEnrollment', () => {
    it('llama GET /api/attendance/{activityId}/enrolled/{userId}', async () => {
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(true)

      const result = await checkUserEnrollment(100, 10)

      expect(jwtPermissionsApi.get).toHaveBeenCalledWith(
        '/api/attendance/100/enrolled/10'
      )
      expect(result).toBe(true)
    })

    it('retorna false cuando no está inscripto', async () => {
      ;(jwtPermissionsApi.get as jest.Mock).mockResolvedValueOnce(false)

      const result = await checkUserEnrollment(100, 10)
      expect(result).toBe(false)
    })
  })
})
