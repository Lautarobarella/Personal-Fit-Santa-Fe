import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { 
  NotificationQuery, 
  NotificationListResult,
  NotificationOperationResult 
} from '../domain/types'
import type { INotificationRepository } from '../domain/repositories'

/**
 * Query keys for React Query cache management
 */
export const notificationQueryKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationQueryKeys.all, 'list'] as const,
  list: (query: NotificationQuery) => [...notificationQueryKeys.lists(), query] as const,
  unreadCount: (userId: number) => [...notificationQueryKeys.all, 'unreadCount', userId] as const,
} as const

/**
 * Custom hook for fetching user notifications
 * Handles loading, error states, and caching
 */
export function useNotificationsList(
  query: NotificationQuery,
  repository: INotificationRepository
) {
  return useQuery({
    queryKey: notificationQueryKeys.list(query),
    queryFn: () => repository.getUserNotifications(query),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 or auth errors
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('401'))) {
        return false
      }
      return failureCount < 2
    },
    select: (data: NotificationListResult) => ({
      ...data,
      notifications: data.notifications || [],
      unreadCount: data.unreadCount || 0,
      totalCount: data.totalCount || 0
    })
  })
}

/**
 * Custom hook for notification mutations (mark as read, delete, etc.)
 */
export function useNotificationMutations(repository: INotificationRepository) {
  const queryClient = useQueryClient()

  const markAsRead = useMutation({
    mutationFn: (notificationId: number) => repository.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate and refetch notification queries
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    },
  })

  const markAsUnread = useMutation({
    mutationFn: (notificationId: number) => repository.markAsUnread(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    },
  })

  const archiveNotification = useMutation({
    mutationFn: (notificationId: number) => repository.archiveNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    },
  })

  const deleteNotification = useMutation({
    mutationFn: (notificationId: number) => repository.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    },
  })

  const markAllAsRead = useMutation({
    mutationFn: (userId: number) => repository.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    },
  })

  return {
    markAsRead,
    markAsUnread,
    archiveNotification,
    deleteNotification,
    markAllAsRead,
  }
}

/**
 * Custom hook for sending notifications (admin only)
 */
export function useNotificationSending(repository: INotificationRepository) {
  const queryClient = useQueryClient()

  const sendNotification = useMutation({
    mutationFn: repository.sendNotification,
    onSuccess: () => {
      // Optionally invalidate queries if needed
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    },
  })

  const sendBulkNotification = useMutation({
    mutationFn: repository.sendBulkNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    },
  })

  return {
    sendNotification,
    sendBulkNotification,
  }
}