"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/notifications/use-notifications"
import { ArrowLeft, Bell, Menu } from "lucide-react"
import Link from "next/link"

interface MobileHeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  showMenu?: boolean
  onMenuClick?: () => void
  actions?: React.ReactNode
}

export function MobileHeader({
  title,
  showBack = false,
  onBack,
  showMenu = false,
  onMenuClick,
  actions,
}: MobileHeaderProps) {
  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-professional transition-all duration-200">
      <div className="container-centered flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="rounded-full hover:bg-accent">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {showMenu && (
            <Button variant="ghost" size="sm" onClick={onMenuClick} className="rounded-full hover:bg-accent">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <Link href="/notifications">
            <Button variant="ghost" size="sm" className="relative rounded-full hover:bg-accent">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-primary text-primary-foreground border-2 border-background"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-primary text-foreground flex items-center justify-center text-sm font-bold shadow-professional">
              {user?.avatar?.[0]}{user?.avatar?.[1]} {/* DEFINIR EL RENDERIZADO CONDICIONAL DE LA FOTO */}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
