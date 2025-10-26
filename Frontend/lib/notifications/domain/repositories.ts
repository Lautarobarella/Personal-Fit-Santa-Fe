import type {
  NotificationEntity,
  NotificationPreferencesEntity,
  DeviceTokenEntity,
  NotificationSubscriptionStatus,
  SendNotificationCommand,
  BulkNotificationCommand,
  RegisterDeviceCommand,
  NotificationOperationResult,
  NotificationListResult,
  NotificationQuery
} from '../domain/types'

/**
 * Repository interface for notification data access
 * Abstraction layer for API calls
 */
export interface INotificationRepository {
  // Basic CRUD operations
  getUserNotifications(query: NotificationQuery): Promise<NotificationListResult>
  markAsRead(notificationId: number): Promise<NotificationOperationResult>
  markAsUnread(notificationId: number): Promise<NotificationOperationResult>
  archiveNotification(notificationId: number): Promise<NotificationOperationResult>
  deleteNotification(notificationId: number): Promise<NotificationOperationResult>
  markAllAsRead(userId: number): Promise<NotificationOperationResult>
  
  // Push notifications
  sendNotification(command: SendNotificationCommand): Promise<NotificationOperationResult>
  sendBulkNotification(command: BulkNotificationCommand): Promise<NotificationOperationResult>
}

/**
 * Repository interface for device token management
 */
export interface IDeviceTokenRepository {
  registerDevice(command: RegisterDeviceCommand): Promise<NotificationOperationResult>
  unregisterDevice(token: string): Promise<NotificationOperationResult>
  getSubscriptionStatus(): Promise<NotificationSubscriptionStatus | null>
  unsubscribeFromPush(): Promise<NotificationOperationResult>
  cleanupInvalidTokens(): Promise<NotificationOperationResult>
}

/**
 * Repository interface for notification preferences
 */
export interface INotificationPreferencesRepository {
  getUserPreferences(): Promise<NotificationPreferencesEntity | null>
  updateUserPreferences(preferences: NotificationPreferencesEntity): Promise<NotificationOperationResult>
}

/**
 * Repository interface for Firebase messaging
 */
export interface IFirebaseRepository {
  requestPermission(): Promise<string | null>
  setupForegroundListener(callback: (payload: any) => void): (() => void) | void
  isSupported(): boolean
}