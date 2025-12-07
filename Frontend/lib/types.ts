export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE"
}

export enum UserRole {
  ADMIN = "ADMIN",
  TRAINER = "TRAINER",
  CLIENT = "CLIENT"
}

export enum ActivityStatus {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED"
}

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  PENDING = "PENDING",
  LATE = "LATE"
}

export enum EnrollmentStatus {
  ENROLLED = "ENROLLED",
  NOT_ENROLLED = "NOT_ENROLLED",
  FULL = "FULL"
}

export enum MethodType {
  CASH = "CASH",
  CARD = "CARD",
  TRANSFER = "TRANSFER",
  MERCADOPAGO = "MERCADOPAGO"
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED"
}

export interface GlobalSettingsType {
  monthlyFee: number
  registrationTimeHours: number
  unregistrationTimeHours: number
  maxActivitiesPerDay: number
  paymentGracePeriodDays: number
}

export enum NotificationStatus {
  READ = "READ",
  UNREAD = "UNREAD",
  ARCHIVED = "ARCHIVED"
}

export interface UserDetailInfo {
  id: number
  dni: number
  firstName: string
  lastName: string
  email: string
  phone: string
  emergencyPhone?: string
  age: number
  birthDate: Date | string | null
  address: string
  role: UserRole
  status: UserStatus
  joinDate: Date | string | null
  lastActivity: Date | string | null
  password: string
  avatar?: string
  listActivity: UserActivityDetails[]
  listPayments: PaymentType[]
}

interface UserActivityDetails {
  id: number
  name: string
  trainerName: string
  date: Date | string | null
  activityStatus: ActivityStatus
  clientStatus: AttendanceStatus // esto es la asistencia del cliente
}

export interface UserType {
  id: number
  dni: number
  firstName: string
  lastName: string
  email: string
  phone: string
  emergencyPhone?: string
  age: number
  birthDate: Date | string | null
  address: string
  role: UserRole
  status: "ACTIVE" | "INACTIVE"
  joinDate: Date | string | null
  activitiesCount: number
  lastActivity: Date | string | null
  password: string
  avatar?: string
}

export interface UserFormType {
  id?: string
  dni: string
  firstName: string
  lastName: string
  email: string
  phone: string
  emergencyPhone?: string
  birthDate: string
  address: string
  role: UserRole
  joinDate: string
  password: string
  avatar?: string
}

export interface ActivityDetailInfo {
  id: number
  name: string
  description: string
  location: string
  trainerId: number
  trainerName: string
  date: Date
  duration: number
  maxParticipants: number
  currentParticipants: number
  participants: ActivityUserDetails[]
  status: ActivityStatus
  createdBy: string
  lastModifiedBy?: string
  createdAt: Date
  lastModified?: Date
  notes?: string
  isRecurring?: boolean
}

interface ActivityUserDetails {
  id: number // userId
  attendanceId: number // attendanceId
  firstName: string
  lastName: string
  createdAt: Date
  status: AttendanceStatus
}

export interface ActivityType {
  id: number
  name: string
  description: string
  location: string
  trainerName: string
  date: Date
  duration: number
  participants: number[]
  maxParticipants: number
  currentParticipants: number
  status: ActivityStatus
  isRecurring?: boolean
}

export interface ActivityFormType {
  id?: string
  name: string
  description: string
  location: string
  trainerId: string
  date: string
  time: string
  duration: string
  maxParticipants: string
  isRecurring?: boolean
}


// Interfaz extendida que incluye información del usuario
export interface Attendance {
  id: number // attendanceId
  activityId: number
  userId: number
  firstName: string
  lastName: string
  status: AttendanceStatus
  createdAt: Date
  updatedAt: Date
}

export interface PaymentType {
  id: number
  clientId: number
  clientName: string
  amount: number
  createdAt: Date | string | null
  expiresAt: Date | string | null
  status: PaymentStatus
  verifiedAt?: Date | string | null
  method: MethodType
  rejectionReason?: string
  receiptId?: number | null
  receiptUrl?: string | null
  notes?: string // Notas adicionales del pago
  // Para pagos múltiples
  associatedUsers?: PaymentUserInfo[]
}

export interface PaymentUserInfo {
  userId: number
  userName: string
  userDni: number
}

export interface MonthlyRevenue {
  id: number
  year: number
  month: number
  monthName: string
  totalRevenue: number
  totalPayments: number
  createdAt: Date | string | null
  updatedAt: Date | string | null
  archivedAt: Date | string | null
  isCurrentMonth: boolean
}

export interface Notification {
  id: number
  title: string
  message: string
  status: NotificationStatus
  createdAt: Date
  userId: number
  userName: string
}

export interface NotificationDetailInfo {
  id: number
  title: string
  message: string
  createdAt: Date
  status: NotificationStatus
  userId: number
  userName: string
}

export interface NotificationFormType {
  id?: string
  title: string
  message: string
  userId: string
}

export interface NewPaymentInput {
  // Para compatibilidad con pagos de MercadoPago (único DNI)
  clientDni?: number
  // Para pagos manuales múltiples (lista de DNIs)
  clientDnis?: number[]
  // DNI del usuario que crea el pago
  createdByDni?: number
  amount: number
  createdAt: string
  expiresAt: string
  paymentStatus: "PENDING" | "PAID"
  method: MethodType
  notes?: string // Notas adicionales del pago
  file?: File
}

export interface EnrollmentRequest {
  activityId: number
  userId: number
  status: AttendanceStatus
  createdAt: Date
}

export interface EnrollmentResponse {
  success: boolean
  message: string
  enrollment?: Attendance
}

export interface WeeklySchedule {
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}

