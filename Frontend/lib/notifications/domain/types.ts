import { NotificationType, NotificationStatus, NotificationCategoryType } from "@/lib/types"

// Domain entities and types for notifications
export interface NotificationEntity {
  id: number
  title: string
  message: string
  infoType: NotificationType
  status: NotificationStatus
  createdAt: Date
  notificationCategory: NotificationCategoryType
}

export interface NotificationPreferencesEntity {
  classReminders: boolean
  paymentDue: boolean
  newClasses: boolean
  promotions: boolean
  classCancellations: boolean
  generalAnnouncements: boolean
}

export interface DeviceTokenEntity {
  token: string
  deviceType: 'PWA' | 'ANDROID' | 'IOS' | 'WEB'
  deviceInfo?: string
  isActive: boolean
}

export interface NotificationSubscriptionStatus {
  isSubscribed: boolean
  activeTokensCount: number
  canSubscribe: boolean
  canUnsubscribe: boolean
}

// Request types
export interface SendNotificationCommand {
  userId: number
  title: string
  body: string
  type?: string
  data?: Record<string, string>
  saveToDatabase?: boolean
}

export interface BulkNotificationCommand {
  title: string
  body: string
  type?: string
  userIds?: number[]
  data?: Record<string, string>
  saveToDatabase?: boolean
}

export interface RegisterDeviceCommand {
  token: string
  deviceType: 'PWA' | 'ANDROID' | 'IOS' | 'WEB'
  userId?: number
  deviceInfo?: string
}

// Result types
export interface NotificationOperationResult {
  success: boolean
  message: string
  data?: any
}

export interface NotificationListResult {
  notifications: NotificationEntity[]
  unreadCount: number
  totalCount: number
}

// Filter and query types
export interface NotificationFilters {
  status?: NotificationStatus
  category?: NotificationCategoryType
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  offset?: number
}

export interface NotificationQuery {
  userId: number
  filters?: NotificationFilters
  sortBy?: 'date' | 'status' | 'category'
  sortOrder?: 'asc' | 'desc'
}