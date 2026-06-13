"use client"

import { useNotificationsList } from "@/hooks/notifications/use-notifications-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bell, Check, Archive, Trash2 } from "lucide-react"
import { NotificationStatus } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface NotificationsListProps {
  filterStatus?: NotificationStatus | "all"
  searchTerm?: string
}

export function NotificationsList({ filterStatus = "all", searchTerm = "" }: NotificationsListProps) {
  const {
    filteredNotifications,
    isLoading,
    handleMarkAsRead,
    handleArchive,
    handleDelete,
  } = useNotificationsList(filterStatus, searchTerm)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full size-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!filteredNotifications || filteredNotifications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center">
        <Bell className="mx-auto mb-3 size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No tienes notificaciones</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {filteredNotifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "rounded-xl border p-4 transition-colors",
            notification.status === NotificationStatus.UNREAD && "border-l-4 border-l-primary",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start gap-2">
                <h3 className="min-w-0 break-words font-semibold leading-snug">{notification.title}</h3>
                {notification.status === NotificationStatus.UNREAD && (
                  <Badge variant="default" className="mt-0.5 shrink-0 text-xs">Nueva</Badge>
                )}
                {notification.status === NotificationStatus.ARCHIVED && (
                  <Badge variant="secondary" className="mt-0.5 shrink-0 text-xs">Archivada</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              <p className="text-xs text-muted-foreground/70">
                {format(new Date(notification.createdAt), "PPp", { locale: es })}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {notification.status === NotificationStatus.UNREAD && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMarkAsRead(notification.id)}
                  title="Marcar como leída"
                >
                  <Check className="size-4" />
                </Button>
              )}

              {notification.status !== NotificationStatus.ARCHIVED && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleArchive(notification.id)}
                  title="Archivar"
                >
                  <Archive className="size-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(notification.id)}
                title="Eliminar"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
