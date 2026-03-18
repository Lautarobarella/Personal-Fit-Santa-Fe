"use client"

import { Home, Calendar, Users, CreditCard, Settings } from "lucide-react"
import { useAuth } from "@/contexts/auth-provider"
import { UserAvatar } from "@/components/ui/user-avatar"
import { UserRole } from "@/lib/types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

export function DesktopSidebar() {
  const { user } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const getNavItems = () => {
    const baseItems = [
      { icon: Home, label: "Inicio", href: "/dashboard" },
      { icon: Calendar, label: "Actividades", href: "/activities" },
    ]

    if (user.role !== UserRole.TRAINER) {
      baseItems.push({ icon: CreditCard, label: "Pagos", href: "/payments" })
    }

    if (user.role === UserRole.ADMIN) {
      baseItems.push({ icon: Users, label: "Clientes", href: "/clients" })
    }

    baseItems.push({ icon: Settings, label: "Configuración", href: "/settings" })
    return baseItems
  }

  const navItems = getNavItems()

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col bg-card border-r border-border/50 shadow-professional">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/50">
        <Image
          src="/logo.png"
          alt="Personal Fit"
          width={120}
          height={48}
          priority
        />
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <UserAvatar
            userId={user?.id}
            firstName={user?.firstName}
            lastName={user?.lastName}
            avatar={user?.avatar}
            className="h-10 w-10 shadow-professional flex-shrink-0"
            fallbackClassName="bg-gradient-primary text-foreground text-sm font-bold"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role === UserRole.ADMIN && "Administrador"}
              {user.role === UserRole.TRAINER && "Entrenador"}
              {user.role === UserRole.CLIENT && "Cliente"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary bg-accent/60 font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/30",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all duration-200 flex-shrink-0",
                  isActive ? "text-primary" : ""
                )}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          Personal Fit Santa Fe
        </p>
      </div>
    </aside>
  )
}
