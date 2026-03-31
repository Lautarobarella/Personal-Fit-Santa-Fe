"use client"

import { TermsAndConditionsDialog } from "@/components/dashboard/terms-and-conditions-dialog"
import { ActivityTimesDialog } from "@/components/settings/activity-time-dialog"
import { CreateNotificationDialog } from "@/components/settings/create-notification-dialog"
import { MaxActivitiesDialog } from "@/components/settings/max-activities-dialog"
import { MonthlyFeeDialog } from "@/components/settings/monthly-fee-dialog"
import { PaymentGracePeriodDialog } from "@/components/settings/payment-grace-period-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Switch } from "@/components/ui/switch"
import { UserAvatar } from "@/components/ui/user-avatar"
import { useSettingsPage } from "@/hooks/settings/use-settings-page"
import { UserRole } from "@/types"
import {
  BarChart3,
  Bell,
  Camera,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  ImagePlus,
  Loader2,
  LogOut,
  Moon,
  NotebookPen,
  Shield,
  Smartphone,
  Users,
  X,
} from "lucide-react"
import { useRef, useState, type ChangeEvent } from "react"

export default function SettingsPage() {
  const {
    user,
    router,
    toggleTheme,
    isDark,
    mounted,
    showActivityTimesDialog,
    setShowActivityTimesDialog,
    showMonthlyFeeDialog,
    setShowMonthlyFeeDialog,
    showMaxActivitiesDialog,
    setShowMaxActivitiesDialog,
    showPaymentGracePeriodDialog,
    setShowPaymentGracePeriodDialog,
    showCreateNotificationDialog,
    setShowCreateNotificationDialog,
    showTermsDialog,
    setShowTermsDialog,
    isUpdatingAvatar,
    handleLogout,
    handleShowTerms,
    handleAvatarUpload,
    handleAvatarDelete,
  } = useSettingsPage()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showRemoveAvatarDialog, setShowRemoveAvatarDialog] = useState(false)
  const hasCustomAvatar = !!user?.avatar?.startsWith("avatars/")

  const handleSelectAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await handleAvatarUpload(file)
    event.target.value = ""
  }

  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <MobileHeader title="Configuración" />

      <div className="container-centered py-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <UserAvatar
                    userId={user?.id}
                    firstName={user?.firstName}
                    lastName={user?.lastName}
                    avatar={user?.avatar}
                    className="h-16 w-16"
                    fallbackClassName="text-lg"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full shadow-md"
                    onClick={() => hasCustomAvatar ? setShowRemoveAvatarDialog(true) : fileInputRef.current?.click()}
                    disabled={isUpdatingAvatar}
                    aria-label={hasCustomAvatar ? "Quitar imagen de perfil" : "Subir imagen de perfil"}
                  >
                    {isUpdatingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : hasCustomAvatar ? (
                      <div className="relative">
                        <Camera className="h-4 w-4" />
                        <X className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-background text-destructive" />
                      </div>
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-xl font-semibold">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => router.push("/settings/edit")}
                      aria-label="Editar perfil"
                    >
                      <NotebookPen className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-primary capitalize">
                    {user?.role === UserRole.ADMIN && "Administrador"}
                    {user?.role === UserRole.TRAINER && "Entrenador"}
                    {user?.role === UserRole.CLIENT && "Cliente"}
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSelectAvatar}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Apariencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Recursos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Términos y Condiciones</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleShowTerms}>
                Ver
              </Button>
            </div>
          </CardContent>
        </Card>

        {user?.role === UserRole.ADMIN && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>Administración</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setShowMonthlyFeeDialog(true)}
              >
                <DollarSign className="h-4 w-4 mr-3" />
                <span className="sm:hidden">Valor cuota</span>
                <span className="hidden sm:inline">Establecer valor de la cuota</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setShowActivityTimesDialog(true)}
              >
                <Clock className="h-4 w-4 mr-3" />
                <span className="sm:hidden">Tiempos act.</span>
                <span className="hidden sm:inline">Configurar tiempos de actividades</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setShowMaxActivitiesDialog(true)}
              >
                <Users className="h-4 w-4 mr-3" />
                <span className="sm:hidden">Max. act./dia</span>
                <span className="hidden sm:inline">Máximo de actividades por día</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setShowPaymentGracePeriodDialog(true)}
              >
                <CreditCard className="h-4 w-4 mr-3" />
                <span className="sm:hidden">Per. gracia pago</span>
                <span className="hidden sm:inline">Período de gracia de pago</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => router.push("/settings/monthly-revenue")}
              >
                <BarChart3 className="h-4 w-4 mr-3" />
                <span className="sm:hidden">Ingresos mes</span>
                <span className="hidden sm:inline">Registro de ingresos mensuales</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowCreateNotificationDialog(true)}
              >
                <Bell className="h-4 w-4 mr-3" />
                <span className="sm:hidden">Notificar</span>
                <span className="hidden sm:inline">Generar notificación</span>
              </Button>
            </CardContent>
          </Card>
        )}

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

      <ActivityTimesDialog
        open={showActivityTimesDialog}
        onOpenChange={setShowActivityTimesDialog}
      />

      <MonthlyFeeDialog
        open={showMonthlyFeeDialog}
        onOpenChange={setShowMonthlyFeeDialog}
      />

      <MaxActivitiesDialog
        open={showMaxActivitiesDialog}
        onOpenChange={setShowMaxActivitiesDialog}
      />

      <PaymentGracePeriodDialog
        open={showPaymentGracePeriodDialog}
        onOpenChange={setShowPaymentGracePeriodDialog}
      />

      <CreateNotificationDialog
        open={showCreateNotificationDialog}
        onOpenChange={setShowCreateNotificationDialog}
      />

      <TermsAndConditionsDialog
        open={showTermsDialog}
        onAccept={() => setShowTermsDialog(false)}
        onReject={() => setShowTermsDialog(false)}
        viewMode="readonly"
      />

      <AlertDialog open={showRemoveAvatarDialog} onOpenChange={setShowRemoveAvatarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar foto de perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará tu imagen actual y volverás a ver tus iniciales como avatar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingAvatar}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isUpdatingAvatar}
              onClick={async () => {
                await handleAvatarDelete()
                setShowRemoveAvatarDialog(false)
              }}
            >
              Quitar imagen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
