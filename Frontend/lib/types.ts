export type UserRole = "administrator" | "trainer" | "client"

export type NotificationType = "success" | "info" | "warning" | "error"
export type NotificationCategoryType = "payment" | "client" | "enrollment" | "activity"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  phone?: string
  createdAt: Date
}

export interface Activity {
  id: string
  name: string
  description: string
  trainer: string
  trainerId: string
  date: Date
  duration: number
  maxParticipants: number
  currentParticipants: number
  price: number
  status: "active" | "cancelled" | "completed"
  participants: string[]
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

export interface Attendance {
  id: string
  clientId: string
  clientName: string
  activityId: string
  activityName: string
  date: Date
  status: "present" | "absent" | "late"
}

export interface Notification {
  id: string
  title: string
  message: string
  infoType: NotificationType
  read: boolean
  archived: boolean
  createdAt: Date
  notificationCategory: NotificationCategoryType
}
