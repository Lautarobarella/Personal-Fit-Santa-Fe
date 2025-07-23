export type UserRole = "admin" | "trainer" | "client"
export type Category = "Principiante" | "Intermedio" |"Avanzado"


export interface UserDetailInfo {
  id: number
  dni: number
  firstName: string
  lastName: string
  email: string
  phone: string
  age: number
  dateOfBirth: Date
  address: string
  role: "admin" | "trainer" | "client"
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
  status: "pending" | "completed" | "failed"
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
  role: "admin" | "trainer" | "client"
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
  category: "Principiante" | "Intermedio" |"Avanzado"
  trainerId: string
  date: Date
  duration: number
  maxParticipants: number
  currentParticipants: number
  participants: string[] // Cambia a number[] si los IDs son números
  status: "active" | "cancelled" | "completed"
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

export interface PaymentType {
  id: number
  clientId: number
  clientName: string
  activityId: string
  activityName: string
  amount: number
  date: Date
  status: "pending" | "completed" | "failed"
  method: "cash" | "card" | "transfer"
}

export interface Attendance {
  id: string
  activityId: string
  userId: string
  createdAt: Date
  status: "present" | "absent" | "late"
}

export interface MonthlyPayment {
  id: string
  clientId: string
  clientName: string
  month: string // "2024-01" format
  amount: number
  dueDate: Date
  status: "pendiente" | "pagado" | "rechazado" | "vencido"
  receiptUrl?: string
  receiptUploadedAt?: Date
  verifiedAt?: Date
  verifiedBy?: string
  rejectionReason?: string
  createdAt: Date
  updatedAt: Date
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
