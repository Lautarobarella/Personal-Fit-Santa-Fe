"use client"

import { useNotificationsContext } from "@/contexts/notifications-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Check, Archive, Trash2 } from "lucide-react"
import { NotificationStatus } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface NotificationsListProps {
  filterStatus?: NotificationStatus | "all"
}

export function NotificationsList({ filterStatus = "all" }: NotificationsListProps) {
  const { 
    notifications, 
    isLoadingNotifications: isLoading,
    markAsRead,
    archiveNotification,
    deleteNotification 
  } = useNotificationsContext()

  const filteredNotifications = filterStatus === "all" 
    ? notifications 
    : notifications.filter(n => n.status === filterStatus)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!filteredNotifications || filteredNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">No tienes notificaciones</p>
      </div>
    )
  }

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id)
  }

  const handleArchive = async (id: number) => {
    await archiveNotification(id)
  }

  const handleDelete = async (id: number) => {
    await deleteNotification(id)
  }

  return (
    <div className="space-y-3">
      {filteredNotifications.map((notification) => (
        <Card 
          key={notification.id} 
          className={notification.status === NotificationStatus.UNREAD ? "border-l-4 border-l-orange-500" : ""}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{notification.title}</h3>
                  {notification.status === NotificationStatus.UNREAD && (
                    <Badge variant="default" className="text-xs">Nueva</Badge>
                  )}
                  {notification.status === NotificationStatus.ARCHIVED && (
                    <Badge variant="secondary" className="text-xs">Archivada</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-400">
                  {format(new Date(notification.createdAt), "PPp", { locale: es })}
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                {notification.status === NotificationStatus.UNREAD && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="Marcar como leída"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                
                {notification.status !== NotificationStatus.ARCHIVED && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleArchive(notification.id)}
                    title="Archivar"
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(notification.id)}
                  title="Eliminar"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
