"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { UserRole } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Switch } from "@/components/ui/switch"
import { useThemeToggle } from "@/hooks/use-theme"
import { Bell, DollarSign, Globe, HelpCircle, LogOut, Moon, SettingsIcon, Shield, Smartphone, User } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { theme, toggleTheme, isDark, mounted } = useThemeToggle()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Configuración" />

      <div className="container-centered py-6 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {`${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{user.firstName + " " + user.lastName}</h2>
                {/* <p className="text-muted-foreground">{user.email}</p> */}
                <p className="text-sm text-blue-600 capitalize">
                          {user.role === UserRole.ADMIN && "Administrador"}
        {user.role === UserRole.TRAINER && "Entrenador"}
        {user.role === UserRole.CLIENT && "Cliente"}

                </p>
              </div>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Aplicación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Notificaciones</p>
                  <p className="text-sm text-muted-foreground">Recibir notificaciones push</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Modo Oscuro</p>
                  <p className="text-sm text-muted-foreground">
                    {mounted ? (isDark ? "Activado" : "Desactivado") : "Cargando..."}
                  </p>
                </div>
              </div>
              <Switch 
                checked={mounted ? isDark : false}
                onCheckedChange={toggleTheme}
                disabled={!mounted}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Instalar App</p>
                  <p className="text-sm text-muted-foreground">Instalar en pantalla de inicio</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Instalar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <User className="h-4 w-4 mr-3" />
              Información Personal
            </Button>

            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Shield className="h-4 w-4 mr-3" />
              Privacidad y Seguridad
            </Button>

            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Globe className="h-4 w-4 mr-3" />
              Idioma y Región
            </Button>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Soporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <HelpCircle className="h-4 w-4 mr-3" />
              Centro de Ayuda
            </Button>

            <Button variant="outline" className="w-full justify-start bg-transparent">
              Contactar Soporte
            </Button>

            <Button variant="outline" className="w-full justify-start bg-transparent">
              Términos y Condiciones
            </Button>
          </CardContent>
        </Card>

        {/* Admin Settings */}
                    {user.role === UserRole.ADMIN && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Administración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-transparent"
                onClick={() => router.push('/settings/monthly-fee')}
              >
                <DollarSign className="h-4 w-4 mr-3" />
                Establecer valor de la cuota
              </Button>

              <Button variant="outline" className="w-full justify-start bg-transparent">
                <SettingsIcon className="h-4 w-4 mr-3" />
                Configuración del Sistema
              </Button>

              <Button variant="outline" className="w-full justify-start bg-transparent">
                Respaldos y Exportación
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Card>
          <CardContent className="p-6">
            <Button variant="destructive" className="w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  )
}
