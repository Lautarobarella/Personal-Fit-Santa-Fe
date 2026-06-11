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
import { MobileHeader } from "@/components/ui/mobile-header"
import { Switch } from "@/components/ui/switch"
import { UserAvatar } from "@/components/ui/user-avatar"
import { useSettingsPage } from "@/hooks/settings/use-settings-page"
import { UserRole } from "@/types"
import {
  Bell,
  Camera,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  ImagePlus,
  Loader2,
  LogOut,
  Moon,
  NotebookPen,
  Users,
  X,
} from "lucide-react"
import { useRef, useState, type ChangeEvent } from "react"

interface AdminAction {
  icon: typeof DollarSign
  shortLabel: string
  label: string
  onClick: () => void
}

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
    if (!file) {
      return
    }

    await handleAvatarUpload(file)
    event.target.value = ""
  }

  const adminActions: AdminAction[] = [
    {
      icon: DollarSign,
      shortLabel: "Valor cuota",
      label: "Establecer valor de la cuota",
      onClick: () => setShowMonthlyFeeDialog(true),
    },
    {
      icon: Clock,
      shortLabel: "Tiempos act.",
      label: "Configurar tiempos de actividades",
      onClick: () => setShowActivityTimesDialog(true),
    },
    {
      icon: Users,
      shortLabel: "Max. act./dia",
      label: "Máximo de actividades por día",
      onClick: () => setShowMaxActivitiesDialog(true),
    },
    {
      icon: CreditCard,
      shortLabel: "Per. gracia pago",
      label: "Período de gracia de pago",
      onClick: () => setShowPaymentGracePeriodDialog(true),
    },
    {
      icon: Bell,
      shortLabel: "Notificar",
      label: "Generar notificación",
      onClick: () => setShowCreateNotificationDialog(true),
    },
  ]

  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <MobileHeader title="Configuración" />

      <div className="container-centered py-6 space-y-6">
        {/* Perfil */}
        <div className="rounded-2xl border p-5">
          <div className="flex items-start gap-4">
            <div className="relative">
              <UserAvatar
                userId={user?.id}
                firstName={user?.firstName}
                lastName={user?.lastName}
                avatar={user?.avatar}
                className="size-16"
                fallbackClassName="text-lg"
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -bottom-2 -left-2 size-8 rounded-full shadow-md"
                onClick={() => hasCustomAvatar ? setShowRemoveAvatarDialog(true) : fileInputRef.current?.click()}
                disabled={isUpdatingAvatar}
                aria-label={hasCustomAvatar ? "Quitar imagen de perfil" : "Subir imagen de perfil"}
              >
                {isUpdatingAvatar ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : hasCustomAvatar ? (
                  <div className="relative">
                    <Camera className="size-4" />
                    <X className="absolute -bottom-1 -right-1 size-3 rounded-full bg-background text-destructive" />
                  </div>
                ) : (
                  <ImagePlus className="size-4" />
                )}
              </Button>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xl font-semibold">
                  {user?.firstName} {user?.lastName}
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0"
                  onClick={() => router.push("/settings/edit")}
                  aria-label="Editar perfil"
                >
                  <NotebookPen className="size-4" />
                </Button>
              </div>
              <p className="text-sm capitalize text-primary">
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
            aria-label="Seleccionar foto de perfil"
            className="hidden"
            onChange={handleSelectAvatar}
          />
        </div>

        {/* Preferencias */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <h3 className="text-base font-semibold">Preferencias</h3>
          </div>
          <div className="divide-y rounded-2xl border">
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Moon className="size-4 text-primary" />
                </span>
                <div className="min-w-0">
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

            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <FileText className="size-4 text-muted-foreground" />
                </span>
                <p className="font-medium">Términos y Condiciones</p>
              </div>
              <Button variant="outline" size="sm" className="bg-transparent" onClick={handleShowTerms}>
                Ver
              </Button>
            </div>
          </div>
        </section>

        {/* Administración */}
        {user?.role === UserRole.ADMIN && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h3 className="text-base font-semibold">Administración</h3>
            </div>
            <div className="divide-y rounded-2xl border">
              {adminActions.map((action, index) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* Secuencia naranja/gris alternada */}
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${index % 2 === 0 ? "bg-primary/10" : "bg-muted"}`}
                  >
                    <action.icon
                      className={`size-4 ${index % 2 === 0 ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    <span className="sm:hidden">{action.shortLabel}</span>
                    <span className="hidden sm:inline">{action.label}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Cierre de sesión */}
        <div className="space-y-5 pt-2">
          <p className="text-center text-[11px] text-muted-foreground/60">
            Desarrollado por Lautaro Barella y Fernando Ale
          </p>
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className="size-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
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
