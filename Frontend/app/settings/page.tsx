"use client"

import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { ActivityTimesDialog } from "@/components/settings/activity-time-dialog"
import { MonthlyFeeDialog } from "@/components/settings/monthly-fee-dialog"
import { MaxActivitiesDialog } from "@/components/settings/max-activities-dialog"
import { PaymentGracePeriodDialog } from "@/components/settings/payment-grace-period-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Switch } from "@/components/ui/switch"
import { useThemeToggle } from "@/hooks/settings/use-theme"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/lib/types"
import { BarChart3, Bell, Clock, CreditCard, DollarSign, Key, LogOut, Moon, Shield, Smartphone, User, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SettingsPage() {
  const { logout } = useAuth()
  const { user } = useRequireAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { theme, toggleTheme, isDark, mounted } = useThemeToggle()
  const [showActivityTimesDialog, setShowActivityTimesDialog] = useState(false)
  const [showMonthlyFeeDialog, setShowMonthlyFeeDialog] = useState(false)
  const [showMaxActivitiesDialog, setShowMaxActivitiesDialog] = useState(false)
  const [showPaymentGracePeriodDialog, setShowPaymentGracePeriodDialog] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleNotificationsToggle = () => {
    toast({
      title: "Función en desarrollo",
      description: "Estamos trabajando en esto",
      variant: "default"
    })
  }

  const handleInstallApp = () => {
    toast({
      title: "Función en desarrollo", 
      description: "Estamos trabajando en esto",
      variant: "default"
    })
  }


  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title="Configuración" />

      <div className="container-centered py-6 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {`${user?.firstName[0] ?? ""}${user?.lastName[0] ?? ""}`}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{user?.firstName + " " + user?.lastName}</h2>
                  {/* <p className="text-muted-foreground">{user.email}</p> */}
                  <p className="text-sm text-primary capitalize">
                    {user?.role === UserRole.ADMIN && "Administrador"}
                    {user?.role === UserRole.TRAINER && "Entrenador"}
                    {user?.role === UserRole.CLIENT && "Cliente"}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push('/settings/edit')}>
                  <User className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push('/settings/change-password')}>
                  <Key className="h-4 w-4 mr-2" />
                  Cambiar contraseña
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
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
              <Switch defaultChecked onCheckedChange={handleNotificationsToggle} />
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
              <Button variant="outline" size="sm" onClick={handleInstallApp}>
                Instalar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Settings */}
        {user?.role === UserRole.ADMIN && (
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
                onClick={() => setShowMonthlyFeeDialog(true)}
              >
                <DollarSign className="h-4 w-4 mr-3" />
                Establecer valor de la cuota
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setShowActivityTimesDialog(true)}
              >
                <Clock className="h-4 w-4 mr-3" />
                Configurar tiempos de actividades
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setShowMaxActivitiesDialog(true)}
              >
                <Users className="h-4 w-4 mr-3" />
                Máximo de actividades por día
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setShowPaymentGracePeriodDialog(true)}
              >
                <CreditCard className="h-4 w-4 mr-3" />
                Período de gracia de pago
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start bg-transparent"
                onClick={() => router.push('/settings/monthly-revenue')}
              >
                <BarChart3 className="h-4 w-4 mr-3" />
                Registro de ingresos mensuales
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

      {/* Activity Times Dialog */}
      <ActivityTimesDialog 
        open={showActivityTimesDialog} 
        onOpenChange={setShowActivityTimesDialog} 
      />

      {/* Monthly Fee Dialog */}
      <MonthlyFeeDialog 
        open={showMonthlyFeeDialog} 
        onOpenChange={setShowMonthlyFeeDialog} 
      />

      {/* Max Activities Dialog */}
      <MaxActivitiesDialog 
        open={showMaxActivitiesDialog} 
        onOpenChange={setShowMaxActivitiesDialog} 
      />

      {/* Payment Grace Period Dialog */}
      <PaymentGracePeriodDialog 
        open={showPaymentGracePeriodDialog} 
        onOpenChange={setShowPaymentGracePeriodDialog} 
      />
    </div>
  )
}
