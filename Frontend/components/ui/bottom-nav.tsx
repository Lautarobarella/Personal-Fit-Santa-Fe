"use client"

import { Home, Calendar, Users, CreditCard, Settings } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { UserRole } from "@/lib/types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function BottomNav() {
  const { user } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const getNavItems = () => {
    const baseItems = [
      { icon: Home, label: "Inicio", href: "/dashboard" },
      { icon: Calendar, label: "Actividades", href: "/activities" },
      { icon: CreditCard, label: "Pagos", href: "/payments" },
    ]

            if (user.role === UserRole.ADMIN) {
      baseItems.push(
        { icon: Users, label: "Clientes", href: "/clients" },
        
      )
    }
            else if (user.role === UserRole.TRAINER) {
      baseItems.push(
        { icon: Users, label: "Clientes", href: "/clients" },
      )
    }

    baseItems.push({ icon: Settings, label: "Config", href: "/settings" })
    return baseItems
  }

  const navItems = getNavItems()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-professional-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 text-xs transition-all duration-200 rounded-xl min-w-[60px]",
                isActive 
                  ? "text-primary bg-accent/50 font-semibold" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/30",
              )}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5 transition-all duration-200", 
                  isActive ? "text-primary scale-110" : "group-hover:scale-105"
                )} 
              />
              <span className={cn(
                "transition-all duration-200",
                isActive ? "text-primary font-semibold" : ""
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
