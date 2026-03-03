"use client"

import { useNotificationsPage } from "@/hooks/notifications/use-notifications-page"
import { NotificationStatus } from "@/types"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Archive, CheckCheck, Search } from "lucide-react"
import { NotificationsList } from "@/components/notifications/notifications-list"
import { Button } from "@/components/ui/button"

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    handleMarkAllAsRead,
    handleArchiveAll,
    hasUnread,
    hasActive,
  } = useNotificationsPage()

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
                  disabled={!hasUnread}
                  className="min-w-[180px] bg-transparent"
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Marcar todas como leidas
                </Button>
                <Button
                  variant="outline"
                  onClick={handleArchiveAll}
                  disabled={!hasActive}
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
