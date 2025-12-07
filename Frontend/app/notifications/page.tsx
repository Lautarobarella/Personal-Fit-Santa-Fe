"use client"

import { useRequireAuth } from "@/hooks/use-require-auth"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useNotificationsContext } from "@/contexts/notifications-provider"
import { NotificationStatus } from "@/lib/types"
import {
    Archive,
    Bell,
    Search,
} from "lucide-react"
import { useState, useMemo } from "react"
import { NotificationsList } from "@/components/notifications/notifications-list"

export default function NotificationsPage() {
    useRequireAuth()
    
    const {
        notifications,
        unreadCount,
    } = useNotificationsContext()

    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState("all")

    // Filtrar notificaciones por tabs y término de búsqueda
    const filteredNotifications = useMemo(() => {
        let filtered = notifications

        // Filtrar por tab
        switch (activeTab) {
            case "unread":
                filtered = notifications.filter((n) => n.status === NotificationStatus.UNREAD)
                break
            case "read":
                filtered = notifications.filter((n) => n.status === NotificationStatus.READ)
                break
            case "archived":
                filtered = notifications.filter((n) => n.status === NotificationStatus.ARCHIVED)
                break
            default:
                filtered = notifications
        }

        // Filtrar por búsqueda
        if (searchTerm) {
            filtered = filtered.filter((n) =>
                n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.message.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        return filtered
    }, [notifications, activeTab, searchTerm])

    return (
        <div className="min-h-screen bg-background pb-32">
            <MobileHeader
                title="Notificaciones"
                showBack
                onBack={() => window.history.back()}
            />

            <div className="container mx-auto px-4 pt-20 pb-24 max-w-4xl">
                {/* Barra de búsqueda */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Buscar notificaciones..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Tabs de filtros */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">
                            <Bell className="h-4 w-4 mr-1" />
                            Todas
                        </TabsTrigger>
                        <TabsTrigger value="unread">
                            <div className="flex items-center gap-1">
                                <Bell className="h-4 w-4" />
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </TabsTrigger>
                        <TabsTrigger value="read">Leídas</TabsTrigger>
                        <TabsTrigger value="archived">
                            <Archive className="h-4 w-4" />
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <TabsContent value="all">
                            <NotificationsList filterStatus="all" />
                        </TabsContent>
                        <TabsContent value="unread">
                            <NotificationsList filterStatus={NotificationStatus.UNREAD} />
                        </TabsContent>
                        <TabsContent value="read">
                            <NotificationsList filterStatus={NotificationStatus.READ} />
                        </TabsContent>
                        <TabsContent value="archived">
                            <NotificationsList filterStatus={NotificationStatus.ARCHIVED} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <BottomNav />
        </div>
    )
}
