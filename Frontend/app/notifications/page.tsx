"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useNotifications } from "@/hooks/use-notifications"
import { useToast } from "@/hooks/use-toast"
import { NotificationCategoryType, NotificationStatus, NotificationType } from "@/lib/types"
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
    Search,
    Trash2,
    Users,
    XCircle,
} from "lucide-react"
import { useEffect, useState } from "react"

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

    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<NotificationStatus | "all">(NotificationStatus.UNREAD)

    useEffect(() => {
        loadNotifications()
    }, [loadNotifications])

    if (!user) {
        return null
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

    // Filtrar notificaciones por estado y término de búsqueda
    const getFilteredNotifications = () => {
        let filtered = notifications
        
        // Filtrar por estado
        switch (statusFilter) {
            case NotificationStatus.UNREAD:
                filtered = notifications.filter((n) => n.status === NotificationStatus.UNREAD)
                break
            case NotificationStatus.READ:
                filtered = notifications.filter((n) => n.status === NotificationStatus.READ)
                break
            case NotificationStatus.ARCHIVED:
                filtered = notifications.filter((n) => n.status === NotificationStatus.ARCHIVED)
                break
            case "all":
                filtered = notifications
                break
        }
        
        // Filtrar por búsqueda
        if (searchTerm) {
            filtered = filtered.filter((n) =>
                n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.message.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }
        
        return filtered
    }

    const filteredNotifications = getFilteredNotifications()
    const unreadNotifications = notifications.filter((n) => n.status === NotificationStatus.UNREAD)
    const readNotifications = notifications.filter((n) => n.status === NotificationStatus.READ)
    const archivedNotifications = notifications.filter((n) => n.status === NotificationStatus.ARCHIVED)

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
            case NotificationType.SUCCESS:
                return <CheckCircle className="h-5 w-5 text-success" />
            case NotificationType.ERROR:
                return <XCircle className="h-5 w-5 text-destructive" />
            case NotificationType.WARNING:
                return <AlertTriangle className="h-5 w-5 text-warning" />
            case NotificationType.INFO:
            default:
                return <Info className="h-5 w-5 text-primary" />
        }
    }

    const getEntityIcon = (entityType: string) => {
        switch (entityType) {
            case NotificationCategoryType.PAYMENT:
                return <CreditCard className="h-4 w-4" />
            case NotificationCategoryType.ACTIVITY:
                return <Calendar className="h-4 w-4" />
            case NotificationCategoryType.CLIENT:
            case NotificationCategoryType.ENROLLMENT:
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
                            <h3 className={`font-medium text-sm ${notification.status === NotificationStatus.UNREAD ? "font-semibold" : ""}`}>
                                {notification.title}
                            </h3>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {notification.status === NotificationStatus.UNREAD && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                                <span className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {getEntityIcon(notification.notificationCategory || "")}
                                <span className="capitalize">
                                    {({ 
                                        [NotificationCategoryType.PAYMENT]: "Pago", 
                                        [NotificationCategoryType.ENROLLMENT]: "Inscripción", 
                                        [NotificationCategoryType.ACTIVITY]: "Actividad", 
                                        [NotificationCategoryType.CLIENT]: "Cliente" 
                                    } as Record<string, string>)[notification.notificationCategory || ""] || ""}
                                </span>
                            </div>
                            {showActions && (
                                <div className="flex items-center gap-1">
                                    {notification.status === NotificationStatus.UNREAD ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={async () => await markAsRead(notification.id)}
                                            className="h-7 px-2"
                                        >
                                            <Check className="h-3 w-3" />
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={async () => await markAsUnread(notification.id)}
                                            className="h-7 px-2"
                                        >
                                            <BellOff className="h-3 w-3" />
                                        </Button>
                                    )}
                                    {notification.status !== NotificationStatus.ARCHIVED ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={async () => await archiveNotification(notification.id)}
                                            className="h-7 px-2"
                                        >
                                            <Archive className="h-3 w-3" />
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={async () => await unarchiveNotification(notification.id)}
                                            className="h-7 px-2"
                                        >
                                            <Archive className="h-3 w-3" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={async () => await deleteNotification(notification.id)}
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
        <div className="min-h-screen bg-background pb-32">
            <MobileHeader
                title="Notificaciones"
                showBack
                onBack={() => window.history.back()}
            />

            <div className="container-centered py-6 space-y-4">
                {/* Buscador */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar notificaciones..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Cards de Filtros - Similar a la página de clientes */}
                <div className="grid grid-cols-3 gap-4">
                    <button
                        className={`rounded-2xl transition-all duration-200 ${statusFilter === NotificationStatus.UNREAD ? "ring-2 ring-red-500/50 bg-red-500/10" : "hover:bg-muted/50"} focus:outline-none`}
                        onClick={() => setStatusFilter(NotificationStatus.UNREAD)}
                    >
                        <Card className="border-0 bg-transparent shadow-none">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-red-600">
                                    {unreadNotifications.length}
                                </div>
                                <div className="text-sm text-muted-foreground">No leídas</div>
                            </CardContent>
                        </Card>
                    </button>
                    <button
                        className={`rounded-2xl transition-all duration-200 ${statusFilter === NotificationStatus.READ ? "ring-2 ring-green-500/50 bg-green-500/10" : "hover:bg-muted/50"} focus:outline-none`}
                        onClick={() => setStatusFilter(NotificationStatus.READ)}
                    >
                        <Card className="border-0 bg-transparent shadow-none">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {readNotifications.length}
                                </div>
                                <div className="text-sm text-muted-foreground">Leídas</div>
                            </CardContent>
                        </Card>
                    </button>
                    <button
                        className={`rounded-2xl transition-all duration-200 ${statusFilter === NotificationStatus.ARCHIVED ? "ring-2 ring-blue-500/50 bg-blue-500/10" : "hover:bg-muted/50"} focus:outline-none`}
                        onClick={() => setStatusFilter(NotificationStatus.ARCHIVED)}
                    >
                        <Card className="border-0 bg-transparent shadow-none">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {archivedNotifications.length}
                                </div>
                                <div className="text-sm text-muted-foreground">Archivadas</div>
                            </CardContent>
                        </Card>
                    </button>
                </div>

                {/* Lista de Notificaciones */}
                <div className="space-y-3">
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notification) => (
                            <NotificationCard key={notification.id} notification={notification} />
                        ))
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                {statusFilter === NotificationStatus.UNREAD && (
                                    <>
                                        <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
                                        <h3 className="text-lg font-medium mb-2">¡Todo al día!</h3>
                                        <p className="text-muted-foreground">
                                            {searchTerm 
                                                ? "No se encontraron notificaciones no leídas" 
                                                : "No tienes notificaciones sin leer"
                                            }
                                        </p>
                                    </>
                                )}
                                {statusFilter === NotificationStatus.READ && (
                                    <>
                                        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No hay notificaciones leídas</h3>
                                        <p className="text-muted-foreground">
                                            {searchTerm 
                                                ? "No se encontraron notificaciones leídas" 
                                                : "Las notificaciones que marques como leídas aparecerán aquí"
                                            }
                                        </p>
                                    </>
                                )}
                                {statusFilter === NotificationStatus.ARCHIVED && (
                                    <>
                                        <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No hay notificaciones archivadas</h3>
                                        <p className="text-muted-foreground">
                                            {searchTerm 
                                                ? "No se encontraron notificaciones archivadas" 
                                                : "Las notificaciones archivadas aparecerán aquí"
                                            }
                                        </p>
                                    </>
                                )}
                                {statusFilter === "all" && (
                                    <>
                                        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No hay notificaciones</h3>
                                        <p className="text-muted-foreground">
                                            {searchTerm 
                                                ? "No se encontraron notificaciones" 
                                                : "No tienes notificaciones disponibles"
                                            }
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Acciones Rápidas */}
                {notifications.length > 0 && (
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-medium mb-3">Acciones Rápidas</h3>
                            <div className="flex flex-wrap gap-2">
                                {unreadNotifications.length > 0 && (
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={async () => {
                                            await markAllAsRead()
                                            toast({
                                                title: "Éxito",
                                                description: "Todas las notificaciones fueron marcadas como leídas",
                                            })
                                        }} 
                                        className="bg-transparent min-w-[180px]"
                                    >
                                        <CheckCheck className="h-4 w-4 mr-2" />
                                        Marcar todas como leídas
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        const allActiveNotifications = notifications.filter(n => n.status !== NotificationStatus.ARCHIVED)
                                        
                                        for (const notification of allActiveNotifications) {
                                            await archiveNotification(notification.id)
                                        }
                                        
                                        toast({
                                            title: "Éxito",
                                            description: `${allActiveNotifications.length} notificaciones archivadas`,
                                        })
                                    }}
                                    disabled={notifications.filter(n => n.status !== NotificationStatus.ARCHIVED).length === 0}
                                    className="bg-transparent min-w-[180px]"
                                >
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archivar todas
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
