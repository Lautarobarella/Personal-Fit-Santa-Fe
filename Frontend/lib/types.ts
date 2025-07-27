export type UserRole = "admin" | "trainer" | "client"
export type ActivityStatus = "active" | "cancelled" | "completed"
export type ClientStatus = "present" | "absent" | "pending" | "late"
export type AttendanceStatus = "present" | "absent" | "late"
export type Category = "Principiante" | "Intermedio" | "Avanzado"
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

interface ActivityUserDetails {
  id: number
  name: string
  trainerName: string
  date: Date
  activityStatus: ActivityStatus
  clientStatus: ClientStatus // esto es la asistencia del cliente
}

interface PaymentUserDetails {
  id: number
  date: Date
  amount: number
  status: PaymentStatus
  method: MethodType
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

export interface UserFormType {
  dni: string
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  address: string
  role: UserRole
  joinDate: string
  password: string
  avatar?: string
}

export interface ActivityDetailInfo {
  id: string
  name: string
  description: string
  location: string
  category: Category
  trainerId: string
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
}

interface ActivityUserDetails {
  id: number
  firstName: string
  lastName: string
  createdAt: Date
  status: ClientStatus
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
}

export interface ActivityFormType {
  name: string
  description: string
  location: string
  category: string
  trainerName: string
  date: string // importante: string, para input type="date"
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
  amount: number
  createdAt: Date
  expiresAt: Date
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
