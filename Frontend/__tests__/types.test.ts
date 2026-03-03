import {
  UserStatus,
  UserRole,
  ActivityStatus,
  AttendanceStatus,
  EnrollmentStatus,
  MethodType,
  PaymentStatus,
  NotificationStatus,
  MuscleGroup,
} from '@/types'

/**
 * Tests that verify the enum values and types are correctly defined.
 * These tests ensure type safety between frontend and backend contracts.
 */
describe('Types & Enums - Contract Validation', () => {
  describe('UserStatus', () => {
    it('debe tener los valores ACTIVE e INACTIVE', () => {
      expect(UserStatus.ACTIVE).toBe('ACTIVE')
      expect(UserStatus.INACTIVE).toBe('INACTIVE')
    })

    it('debe tener exactamente 2 valores', () => {
      expect(Object.keys(UserStatus)).toHaveLength(2)
    })
  })

  describe('UserRole', () => {
    it('debe tener ADMIN, TRAINER, CLIENT', () => {
      expect(UserRole.ADMIN).toBe('ADMIN')
      expect(UserRole.TRAINER).toBe('TRAINER')
      expect(UserRole.CLIENT).toBe('CLIENT')
    })

    it('debe tener exactamente 3 valores', () => {
      expect(Object.keys(UserRole)).toHaveLength(3)
    })
  })

  describe('ActivityStatus', () => {
    it('debe tener ACTIVE, CANCELLED, COMPLETED', () => {
      expect(ActivityStatus.ACTIVE).toBe('ACTIVE')
      expect(ActivityStatus.CANCELLED).toBe('CANCELLED')
      expect(ActivityStatus.COMPLETED).toBe('COMPLETED')
    })
  })

  describe('AttendanceStatus', () => {
    it('debe tener PRESENT, ABSENT, PENDING, LATE', () => {
      expect(AttendanceStatus.PRESENT).toBe('PRESENT')
      expect(AttendanceStatus.ABSENT).toBe('ABSENT')
      expect(AttendanceStatus.PENDING).toBe('PENDING')
      expect(AttendanceStatus.LATE).toBe('LATE')
    })

    it('debe tener exactamente 4 valores', () => {
      expect(Object.keys(AttendanceStatus)).toHaveLength(4)
    })
  })

  describe('EnrollmentStatus', () => {
    it('debe tener ENROLLED, NOT_ENROLLED, FULL', () => {
      expect(EnrollmentStatus.ENROLLED).toBe('ENROLLED')
      expect(EnrollmentStatus.NOT_ENROLLED).toBe('NOT_ENROLLED')
      expect(EnrollmentStatus.FULL).toBe('FULL')
    })
  })

  describe('MethodType', () => {
    it('debe tener CASH, CARD, TRANSFER, MERCADOPAGO', () => {
      expect(MethodType.CASH).toBe('CASH')
      expect(MethodType.CARD).toBe('CARD')
      expect(MethodType.TRANSFER).toBe('TRANSFER')
      expect(MethodType.MERCADOPAGO).toBe('MERCADOPAGO')
    })

    it('debe tener exactamente 4 métodos de pago', () => {
      expect(Object.keys(MethodType)).toHaveLength(4)
    })
  })

  describe('PaymentStatus', () => {
    it('debe tener PENDING, PAID, REJECTED, EXPIRED', () => {
      expect(PaymentStatus.PENDING).toBe('PENDING')
      expect(PaymentStatus.PAID).toBe('PAID')
      expect(PaymentStatus.REJECTED).toBe('REJECTED')
      expect(PaymentStatus.EXPIRED).toBe('EXPIRED')
    })

    it('debe tener exactamente 4 estados de pago', () => {
      expect(Object.keys(PaymentStatus)).toHaveLength(4)
    })
  })

  describe('NotificationStatus', () => {
    it('debe tener READ, UNREAD, ARCHIVED', () => {
      expect(NotificationStatus.READ).toBe('READ')
      expect(NotificationStatus.UNREAD).toBe('UNREAD')
      expect(NotificationStatus.ARCHIVED).toBe('ARCHIVED')
    })
  })

  describe('MuscleGroup', () => {
    it('debe contener los 11 grupos musculares', () => {
      const expectedGroups = [
        'PECHO', 'ESPALDA', 'BICEP', 'ABDOMINALES',
        'ADUCTORES', 'CUADRICEPS', 'GEMELOS', 'ISQUIOS',
        'HOMBROS', 'TRICEP', 'CARDIO_FUNCIONAL',
      ]

      expectedGroups.forEach(group => {
        expect(MuscleGroup[group as keyof typeof MuscleGroup]).toBe(group)
      })
    })

    it('debe tener exactamente 11 valores', () => {
      expect(Object.keys(MuscleGroup)).toHaveLength(11)
    })
  })
})
