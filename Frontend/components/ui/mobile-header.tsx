"use client"

import type React from "react"

import { useAuth } from "@/components/providers/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

  // Mock unread notifications count - in real app this would come from context/API
  const unreadCount = 10

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200">
      <div className="container-centered flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {showMenu && (
            <Button variant="ghost" size="sm" onClick={onMenuClick}>
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <Link href="/notifications">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {user?.firstName[0]}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
