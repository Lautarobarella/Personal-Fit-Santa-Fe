"use client"

import type React from "react"

import { ArrowLeft, Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
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
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {user?.name.charAt(0)}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
