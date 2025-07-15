export type UserRole = "administrator" | "trainer" | "client"

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

export interface Payment {
  id: string
  clientId: string
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
  type: "info" | "success" | "warning" | "error"
  read: boolean
  createdAt: Date
  userId: string
}
