"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotifications } from "@/hooks/use-notifications"
import { useToast } from "@/hooks/use-toast"
import {
    AlertTriangle,
    Archive,
    Bell,
    BellOff,
    Calendar,
    Check,
    CheckCheck,
    CheckCircle,
    CreditCard,
    Info,
    Loader2,
    Trash2,
    Users,
    XCircle,
} from "lucide-react"
import { useEffect } from "react"


export default function NotificationsPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const {
        notifications,
        loading,
        error,
        loadNotifications,
        markAsRead,
        markAsUnread,
        archiveNotification,
        unarchiveNotification,
        deleteNotification,
        markAllAsRead,
    } = useNotifications()

    useEffect(() => {
        loadNotifications()
    }, [loadNotifications])

    if (!user || user.role !== "admin") {
        return <div>No tienes permisos para ver esta página</div>
    }

    if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )
      }

    if (error) return <div>{error}</div>
    if (!notifications) return null

    const unreadNotifications = notifications.filter((n) => !n.read && !n.archived)
    const readNotifications = notifications.filter((n) => n.read && !n.archived)
    const archivedNotifications = notifications.filter((n) => n.archived)

    const formatDate = (date: Date) => {
        const now = new Date()
        const dateNow = new Date(date)
        const diffInHours = (now.getTime() - dateNow.getTime()) / (1000 * 60 * 60)

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
            }).format(new Date(date))
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


    const NotificationCard = ({
        notification,
        showActions = true,
    }: {
        notification: (typeof notifications)[0]
        showActions?: boolean
    }) => (
        <Card key={notification.id}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.infoType)}</div>
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
                                {getEntityIcon(notification.notificationCategory || "")}
                                <span className="capitalize">
                                    {({ payment: "Pago", enrollment: "Inscripción", activity: "Actividad", client: "Cliente" } as Record<string, string>)[notification.notificationCategory || ""] || ""}
                                </span>
                            </div>
                            {showActions && (
                                <div className="flex items-center gap-1">
                                    {!notification.read ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => markAsRead(notification.id)}
                                            className="h-7 px-2"
                                        >
                                            <Check className="h-3 w-3" />
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => markAsUnread(notification.id)}
                                            className="h-7 px-2"
                                        >
                                            <BellOff className="h-3 w-3" />
                                        </Button>
                                    )}
                                    {!notification.archived ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => archiveNotification(notification.id)}
                                            className="h-7 px-2"
                                        >
                                            <Archive className="h-3 w-3" />
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => unarchiveNotification(notification.id)}
                                            className="h-7 px-2"
                                        >
                                            <Archive className="h-3 w-3" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteNotification(notification.id)}
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
                                <Badge variant="destructive" className="ml-2 h-5 w-5 p-1 text-xs">
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
                {notifications.length > 0 && (
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-medium mb-3">Acciones Rápidas</h3>
                            <div className="flex flex-wrap gap-2">
                                {unreadNotifications.length > 0 && (
                                    <Button variant="outline" size="sm" onClick={() => markAllAsRead()} className="bg-transparent">
                                        <CheckCheck className="h-4 w-4 mr-2" />
                                        Marcar todas como leídas
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const unreadIds = unreadNotifications.map((n) => n.id)
                                        unreadIds.forEach((id) => archiveNotification(id))
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
