"use client"

import { Home, Calendar, Users, CreditCard, Settings } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
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

    if (user.role === "admin") {
      baseItems.push(
        { icon: Users, label: "Clientes", href: "/clients" },
        
      )
    }
    else if (user.role === "trainer") {
      baseItems.push(
        { icon: Users, label: "Clientes", href: "/clients" },
      )
    }

    baseItems.push({ icon: Settings, label: "Config", href: "/settings" })
    return baseItems
  }

  const navItems = getNavItems()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn(isActive && "text-primary font-medium")}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
