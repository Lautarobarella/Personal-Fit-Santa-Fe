export type UserRole = "admin" | "trainer" | "client"
export type ActivityStatus = "active" | "cancelled" | "completed"
export type ClientStatus = "present" | "absent" | "pending" | "late"
export type AttendanceStatus = "present" | "absent" | "late"
export type Category = "Principiante" | "Intermedio" |"Avanzado"
export type MethodType = "cash" | "card" | "transfer"
export type PaymentStatus = "pending" | "paid" | "rejected" | "debtor"


export interface UserDetailInfo {
  id: number
  dni: number
  firstName: string
  lastName: string
  email: string
  phone: string
  age: number
  birthDate: Date
  address: string
  role: UserRole
  status: "active" | "inactive"
  joinDate: Date
  lastActivity: Date | null
  password: string
  avatar?: string
  listActivity: ActivityUserDetails[]
  listPayments: PaymentUserDetails[]
}

interface ActivityUserDetails{
  id: number
  name: string
  trainerName: string
  date: Date
  activityStatus: "active" | "cancelled" | "completed"
  clientStatus: "present" | "absent" | "pending" | "late" // esto es la asistencia del cliente
}

interface PaymentUserDetails {
  id: number
  date: Date
  amount: number
  status: PaymentStatus
  method: "cash" | "card" | "transfer"
}

export interface UserType {
  id: number
  dni: number
  firstName: string
  lastName: string
  email: string
  phone: string
  age: number
  birthDate: Date
  address: string
  role: UserRole
  status: "active" | "inactive"
  joinDate: Date
  activitiesCount: number
  lastActivity: Date | null
  password: string
  avatar?: string
}

export interface ActivityType {
  id: string
  name: string
  description: string
  location: string
  category: Category
  trainerId: string
  date: Date
  duration: number
  maxParticipants: number
  currentParticipants: number
  participants: string[] // Cambia a number[] si los IDs son números
  status: ActivityStatus
  createdBy: string
  lastModifiedBy?: string
  createdAt: Date
  lastModified?: Date
  notes?: string
}

export interface ActivityFormType {
  name: string
  description: string
  location: string
  category: string
  trainer: string
  date: string // importante: string, para input type="date"
  time: string // importante: string, para input type="time"
  duration: string
  maxParticipants: string
}

export interface Attendance {
  id: string
  activityId: string
  userId: string
  createdAt: Date
  status: AttendanceStatus
}

export interface VerifyPaymentType {
  id: number
  clientId: number
  clientName: string
  amount: number
  createdAt: Date
  expiresAt: Date
  status: PaymentStatus
  receiptUrl?: string
  method: MethodType
  rejectionReason?: string
}

export interface PaymentType {
  id: number
  clientId: number
  clientName: string
  createdAt: Date
  expiresAt: Date
  amount: number
  status: PaymentStatus
  verifiedAt?: Date
  rejectionReason?: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  createdAt: Date
  userId: string
}
