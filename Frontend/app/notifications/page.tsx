"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { MobileHeader } from "@/components/ui/mobile-header"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell,
  BellOff,
  Archive,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  CreditCard,
  Users,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock notifications data
const mockNotifications = [
  {
    id: "1",
    title: "Nuevo pago recibido",
    message: "María González ha subido un comprobante de pago para enero 2024",
    type: "success" as const,
    read: false,
    archived: false,
    createdAt: new Date("2024-01-15T10:30:00"),
    userId: "1", // Admin
    relatedEntity: {
      type: "payment",
      id: "payment-1",
    },
  },
  {
    id: "2",
    title: "Nueva inscripción",
    message: "Juan Pérez se ha inscrito a la clase de CrossFit Avanzado",
    type: "info" as const,
    read: false,
    archived: false,
    createdAt: new Date("2024-01-15T09:15:00"),
    userId: "1", // Admin
    relatedEntity: {
      type: "enrollment",
      id: "enrollment-1",
    },
  },
  {
    id: "3",
    title: "Pago vencido",
    message: "El pago de Ana Martín para enero 2024 ha vencido",
    type: "warning" as const,
    read: false,
    archived: false,
    createdAt: new Date("2024-01-15T08:00:00"),
    userId: "1", // Admin
    relatedEntity: {
      type: "payment",
      id: "payment-2",
    },
  },
  {
    id: "4",
    title: "Clase completada",
    message: "Has completado la clase de Yoga Matutino con 12 asistentes",
    type: "success" as const,
    read: true,
    archived: false,
    createdAt: new Date("2024-01-14T11:00:00"),
    userId: "2", // Trainer
    relatedEntity: {
      type: "activity",
      id: "activity-1",
    },
  },
  {
    id: "5",
    title: "Recordatorio de clase",
    message: "Tienes una clase de Pilates programada para mañana a las 10:00 AM",
    type: "info" as const,
    read: true,
    archived: false,
    createdAt: new Date("2024-01-14T18:00:00"),
    userId: "3", // Client
    relatedEntity: {
      type: "activity",
      id: "activity-2",
    },
  },
  {
    id: "6",
    title: "Pago confirmado",
    message: "Tu pago para enero 2024 ha sido confirmado",
    type: "success" as const,
    read: true,
    archived: true,
    createdAt: new Date("2024-01-13T14:30:00"),
    userId: "3", // Client
    relatedEntity: {
      type: "payment",
      id: "payment-3",
    },
  },
  {
    id: "7",
    title: "Clase cancelada",
    message: "La clase de Spinning del viernes ha sido cancelada por el entrenador",
    type: "error" as const,
    read: true,
    archived: false,
    createdAt: new Date("2024-01-12T16:45:00"),
    userId: "3", // Client
    relatedEntity: {
      type: "activity",
      id: "activity-3",
    },
  },
  {
    id: "8",
    title: "Nuevo cliente registrado",
    message: "Laura Sánchez se ha registrado como nueva cliente",
    type: "info" as const,
    read: true,
    archived: true,
    createdAt: new Date("2024-01-10T12:20:00"),
    userId: "1", // Admin
    relatedEntity: {
      type: "client",
      id: "client-1",
    },
  },
]

export default function NotificationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState(mockNotifications)

  if (!user) return null

  // Filter notifications for current user
  const userNotifications = notifications.filter((n) => n.userId === user.id.toString())

  const unreadNotifications = userNotifications.filter((n) => !n.read && !n.archived)
  const readNotifications = userNotifications.filter((n) => n.read && !n.archived)
  const archivedNotifications = userNotifications.filter((n) => n.archived)

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `Hace ${diffInMinutes} min`
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} h`
    } else if (diffInHours < 48) {
      return "Ayer"
    } else {
      return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
      }).format(date)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-success" />
      case "error":
        return <XCircle className="h-5 w-5 text-destructive" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-warning" />
      case "info":
      default:
        return <Info className="h-5 w-5 text-primary" />
    }
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "payment":
        return <CreditCard className="h-4 w-4" />
      case "activity":
        return <Calendar className="h-4 w-4" />
      case "client":
      case "enrollment":
        return <Users className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    toast({
      title: "Marcado como leído",
      description: "La notificación ha sido marcada como leída",
    })
  }

  const handleMarkAsUnread = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n)))
    toast({
      title: "Marcado como no leído",
      description: "La notificación ha sido marcada como no leída",
    })
  }

  const handleArchive = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, archived: true, read: true } : n)))
    toast({
      title: "Notificación archivada",
      description: "La notificación ha sido movida al archivo",
    })
  }

  const handleUnarchive = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, archived: false } : n)))
    toast({
      title: "Notificación restaurada",
      description: "La notificación ha sido restaurada desde el archivo",
    })
  }

  const handleDelete = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    toast({
      title: "Notificación eliminada",
      description: "La notificación ha sido eliminada permanentemente",
    })
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => (n.userId === user.id.toString() && !n.read ? { ...n, read: true } : n)))
    toast({
      title: "Todas marcadas como leídas",
      description: "Todas las notificaciones han sido marcadas como leídas",
    })
  }

  const NotificationCard = ({
    notification,
    showActions = true,
  }: {
    notification: (typeof mockNotifications)[0]
    showActions?: boolean
  }) => (
    <Card key={notification.id} className={`${!notification.read ? "border-primary/50 bg-primary/5" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={`font-medium text-sm ${!notification.read ? "font-semibold" : ""}`}>
                {notification.title}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!notification.read && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                <span className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getEntityIcon(notification.relatedEntity?.type || "")}
                <span className="capitalize">{notification.relatedEntity?.type || "general"}</span>
              </div>
              {showActions && (
                <div className="flex items-center gap-1">
                  {!notification.read ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="h-7 px-2"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsUnread(notification.id)}
                      className="h-7 px-2"
                    >
                      <BellOff className="h-3 w-3" />
                    </Button>
                  )}
                  {!notification.archived ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(notification.id)}
                      className="h-7 px-2"
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnarchive(notification.id)}
                      className="h-7 px-2"
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(notification.id)}
                    className="h-7 px-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader
        title="Notificaciones"
        showBack
        onBack={() => window.history.back()}
        actions={
          unreadNotifications.length > 0 ? (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="bg-transparent">
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todas
            </Button>
          ) : null
        }
      />

      <div className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{unreadNotifications.length}</div>
              <div className="text-sm text-muted-foreground">No leídas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{readNotifications.length}</div>
              <div className="text-sm text-muted-foreground">Leídas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-muted-foreground">{archivedNotifications.length}</div>
              <div className="text-sm text-muted-foreground">Archivadas</div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Tabs */}
        <Tabs defaultValue="unread" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="unread" className="relative">
              No leídas
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read">Leídas</TabsTrigger>
            <TabsTrigger value="archived">Archivadas</TabsTrigger>
          </TabsList>

          {/* Unread Notifications */}
          <TabsContent value="unread" className="space-y-3 mt-4">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
                  <h3 className="text-lg font-medium mb-2">¡Todo al día!</h3>
                  <p className="text-muted-foreground">No tienes notificaciones sin leer</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Read Notifications */}
          <TabsContent value="read" className="space-y-3 mt-4">
            {readNotifications.length > 0 ? (
              readNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay notificaciones leídas</h3>
                  <p className="text-muted-foreground">Las notificaciones que marques como leídas aparecerán aquí</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Archived Notifications */}
          <TabsContent value="archived" className="space-y-3 mt-4">
            {archivedNotifications.length > 0 ? (
              archivedNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay notificaciones archivadas</h3>
                  <p className="text-muted-foreground">Las notificaciones archivadas aparecerán aquí</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        {userNotifications.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Acciones Rápidas</h3>
              <div className="flex flex-wrap gap-2">
                {unreadNotifications.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="bg-transparent">
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Marcar todas como leídas
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const unreadIds = unreadNotifications.map((n) => n.id)
                    unreadIds.forEach((id) => handleArchive(id))
                  }}
                  disabled={unreadNotifications.length === 0}
                  className="bg-transparent"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archivar no leídas
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
