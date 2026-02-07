"use client"

import { useRequireAuth } from "@/hooks/use-require-auth"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useNotificationsContext } from "@/contexts/notifications-provider"
import { NotificationStatus } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Archive, CheckCheck, Search } from "lucide-react"
import { useState } from "react"
import { NotificationsList } from "@/components/notifications/notifications-list"
import { Button } from "@/components/ui/button"

export default function NotificationsPage() {
  useRequireAuth()
  const { toast } = useToast()

  const {
    notifications,
    unreadCount,
    markAsRead,
    archiveNotification,
  } = useNotificationsContext()

  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((notification) => notification.status === NotificationStatus.UNREAD)

    try {
      await Promise.all(unreadNotifications.map((notification) => markAsRead(notification.id)))
      toast({
        title: "Exito",
        description: `${unreadNotifications.length} notificaciones marcadas como leidas`,
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron marcar todas como leidas",
        variant: "destructive",
      })
    }
  }

  const handleArchiveAll = async () => {
    const allActiveNotifications = notifications.filter((notification) => notification.status !== NotificationStatus.ARCHIVED)

    try {
      await Promise.all(allActiveNotifications.map((notification) => archiveNotification(notification.id)))
      toast({
        title: "Exito",
        description: `${allActiveNotifications.length} notificaciones archivadas`,
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron archivar todas las notificaciones",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title="Notificaciones" showBack onBack={() => window.history.back()} />

      <div className="container mx-auto max-w-4xl px-4 pb-24 pt-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar notificaciones..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-sm">Todas</TabsTrigger>
            <TabsTrigger value="unread" className="text-sm">
              <div className="flex items-center gap-1.5">
                <span>Nuevas</span>
                {unreadCount > 0 && (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] leading-none text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="read" className="text-sm">Leidas</TabsTrigger>
            <TabsTrigger value="archived" className="text-sm">Archivadas</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="all">
              <NotificationsList filterStatus="all" searchTerm={searchTerm} />
            </TabsContent>
            <TabsContent value="unread">
              <NotificationsList filterStatus={NotificationStatus.UNREAD} searchTerm={searchTerm} />
            </TabsContent>
            <TabsContent value="read">
              <NotificationsList filterStatus={NotificationStatus.READ} searchTerm={searchTerm} />
            </TabsContent>
            <TabsContent value="archived">
              <NotificationsList filterStatus={NotificationStatus.ARCHIVED} searchTerm={searchTerm} />
            </TabsContent>
          </div>
        </Tabs>

        {notifications.length > 0 && (
          <Card className="mb-4 mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rapidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                  disabled={notifications.filter((notification) => notification.status === NotificationStatus.UNREAD).length === 0}
                  className="min-w-[180px] bg-transparent"
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Marcar todas como leidas
                </Button>
                <Button
                  variant="outline"
                  onClick={handleArchiveAll}
                  disabled={notifications.filter((notification) => notification.status !== NotificationStatus.ARCHIVED).length === 0}
                  className="min-w-[180px] bg-transparent"
                >
                  <Archive className="mr-2 h-4 w-4" />
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
