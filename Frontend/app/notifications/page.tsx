"use client"

import { useNotificationsPage } from "@/hooks/notifications/use-notifications-page"
import { NotificationStatus } from "@/types"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    <div className="min-h-screen bg-background pb-safe-bottom">
      <MobileHeader title="Notificaciones" showBack onBack={() => window.history.back()} />

      <div className="container-centered pt-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 transform text-muted-foreground" />
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
            <TabsTrigger value="read" className="text-sm">Leídas</TabsTrigger>
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
          <section className="mb-4 mt-8">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h3 className="text-base font-semibold">Acciones Rápidas</h3>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={handleMarkAllAsRead}
                disabled={!hasUnread}
                className="flex-1 bg-transparent"
              >
                <CheckCheck className="mr-2 size-4" />
                Marcar todas como leídas
              </Button>
              <Button
                variant="outline"
                onClick={handleArchiveAll}
                disabled={!hasActive}
                className="flex-1 bg-transparent"
              >
                <Archive className="mr-2 size-4" />
                Archivar todas
              </Button>
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
