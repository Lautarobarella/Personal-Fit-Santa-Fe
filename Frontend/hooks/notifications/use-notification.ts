"use client"

import { 
  fetchNotifications, 
  fetchNotificationDetail,
  newNotification,
  deleteNotification as deleteNotificationApi,
  markNotificationAsRead,
  markNotificationAsUnread,
  archiveNotification as archiveNotificationApi,
  unarchiveNotification as unarchiveNotificationApi
} from "@/api/notifications/notificationsApi"
import { useAuth } from "@/contexts/auth-provider"
import { 
  Notification, 
  NotificationDetailInfo, 
  NotificationFormType,
  NotificationStatus
} from "@/lib/types"
import { useCallback, useState, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/**
 * Tipos para el estado del hook
 */
interface NotificationLoadingStates {
  isCreating: boolean
  isDeleting: boolean
  isUpdating: boolean
}

interface NotificationMutationResult {
  success: boolean
  message: string
}

/**
 * Custom Hook para manejar todo el estado y lógica de notificaciones
 * Centraliza toda la lógica de negocio y estado en un solo lugar
 */
export function useNotification() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // Estado del formulario
  const [form, setForm] = useState<NotificationFormType>({
    title: "",
    message: "",
    userId: "",
  })

  // Verificación de permisos
  const isAdmin = user?.role === 'ADMIN'
  const canManageNotifications = isAdmin

  // ===============================
  // QUERIES (Consultas de datos)
  // ===============================

  // Query para todas las notificaciones del usuario
  const {
    data: notifications = [],
    isLoading: isLoadingNotifications,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  })

  // Query para detalles de notificación seleccionada
  const {
    data: selectedNotification = null,
    isLoading: isLoadingNotificationDetail,
  } = useQuery<NotificationDetailInfo | null>({
    queryKey: ['notification-detail'],
    queryFn: () => null, // Se maneja manualmente
    enabled: false,
  })

  // ===============================
  // MUTATIONS (Modificaciones de datos)
  // ===============================

  const createNotificationMutation = useMutation({
    mutationFn: (notification: Omit<NotificationFormType, 'id'>) => newNotification(notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotificationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.setQueryData(['notification-detail'], null)
    },
  })

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-detail'] })
    },
  })

  const markAsUnreadMutation = useMutation({
    mutationFn: markNotificationAsUnread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-detail'] })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: archiveNotificationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-detail'] })
    },
  })

  const unarchiveMutation = useMutation({
    mutationFn: unarchiveNotificationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-detail'] })
    },
  })

  // ===============================
  // FUNCIONES DE UTILIDAD
  // ===============================

  // Función para resetear el formulario
  const resetForm = useCallback(() => {
    setForm({
      title: "",
      message: "",
      userId: "",
    })
  }, [])

  // Función para obtener notificaciones no leídas
  const getUnreadNotifications = useCallback((): Notification[] => {
    return notifications.filter(n => n.status === NotificationStatus.UNREAD)
  }, [notifications])

  // Función para obtener notificaciones archivadas
  const getArchivedNotifications = useCallback((): Notification[] => {
    return notifications.filter(n => n.status === NotificationStatus.ARCHIVED)
  }, [notifications])

  // Conteo de no leídas (valor directo, no función)
  const unreadCount = useMemo(() => {
    return notifications.filter(n => n.status === NotificationStatus.UNREAD).length
  }, [notifications])

  // Función para crear notificación
  const createNotification = useCallback(async (notification: Omit<NotificationFormType, 'id'>): Promise<NotificationMutationResult> => {
    try {
      await createNotificationMutation.mutateAsync(notification)
      return { success: true, message: 'Notificación creada exitosamente' }
    } catch (error) {
      return { success: false, message: 'Error al crear la notificación' }
    }
  }, [createNotificationMutation])

  // Función para eliminar notificación
  const deleteNotification = useCallback(async (id: number): Promise<NotificationMutationResult> => {
    try {
      await deleteNotificationMutation.mutateAsync(id)
      return { success: true, message: 'Notificación eliminada exitosamente' }
    } catch (error) {
      return { success: false, message: 'Error al eliminar la notificación' }
    }
  }, [deleteNotificationMutation])

  // Función para marcar como leída
  const markAsRead = useCallback(async (id: number): Promise<NotificationMutationResult> => {
    try {
      await markAsReadMutation.mutateAsync(id)
      return { success: true, message: 'Notificación marcada como leída' }
    } catch (error) {
      return { success: false, message: 'Error al marcar la notificación' }
    }
  }, [markAsReadMutation])

  // Función para marcar como no leída
  const markAsUnread = useCallback(async (id: number): Promise<NotificationMutationResult> => {
    try {
      await markAsUnreadMutation.mutateAsync(id)
      return { success: true, message: 'Notificación marcada como no leída' }
    } catch (error) {
      return { success: false, message: 'Error al marcar la notificación' }
    }
  }, [markAsUnreadMutation])

  // Función para archivar
  const archiveNotification = useCallback(async (id: number): Promise<NotificationMutationResult> => {
    try {
      await archiveMutation.mutateAsync(id)
      return { success: true, message: 'Notificación archivada exitosamente' }
    } catch (error) {
      return { success: false, message: 'Error al archivar la notificación' }
    }
  }, [archiveMutation])

  // Función para desarchivar
  const unarchiveNotification = useCallback(async (id: number): Promise<NotificationMutationResult> => {
    try {
      await unarchiveMutation.mutateAsync(id)
      return { success: true, message: 'Notificación desarchivada exitosamente' }
    } catch (error) {
      return { success: false, message: 'Error al desarchivar la notificación' }
    }
  }, [unarchiveMutation])

  // Función para obtener los detalles de una notificación
  const getNotificationDetail = useCallback(async (id: number): Promise<NotificationDetailInfo | null> => {
    try {
      const detail = await fetchNotificationDetail(id)
      queryClient.setQueryData(['notification-detail'], detail)
      return detail
    } catch (error) {
      return null
    }
  }, [queryClient])

  // ===============================
  // ESTADO DE CARGA
  // ===============================

  const loadingStates: NotificationLoadingStates = {
    isCreating: createNotificationMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isUpdating: markAsReadMutation.isPending || markAsUnreadMutation.isPending || 
                archiveMutation.isPending || unarchiveMutation.isPending,
  }

  // ===============================
  // RETURN DEL HOOK
  // ===============================

  return {
    // Estado de datos
    notifications,
    selectedNotification,
    form,
    setForm,

    // Estado de carga
    isLoadingNotifications,
    isLoadingNotificationDetail,
    ...loadingStates,

    // Errores
    notificationsError,

    // Permisos
    isAdmin,
    canManageNotifications,

    // Funciones de consulta
    refetchNotifications,
    getUnreadNotifications,
    getArchivedNotifications,
    unreadCount,
    getNotificationDetail,

    // Funciones de mutación
    createNotification,
    deleteNotification,
    markAsRead,
    markAsUnread,
    archiveNotification,
    unarchiveNotification,

    // Utilidades
    resetForm,
  }
}

/**
 * Tipo de retorno del hook para usar en contextos
 */
export type NotificationState = ReturnType<typeof useNotification>
