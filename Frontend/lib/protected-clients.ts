import type { AttendanceType, PaymentType } from "@/types"

export const PROTECTED_CLIENT_DNIS = new Set([42870789, 42331259])

export const paymentIncludesProtectedClient = (payment: PaymentType) =>
  payment.associatedUsers?.some((user) => PROTECTED_CLIENT_DNIS.has(user.userDni)) ?? false

export const attendanceBelongsToProtectedClient = (attendance: AttendanceType) =>
  typeof attendance.dni === "number" && PROTECTED_CLIENT_DNIS.has(attendance.dni)
