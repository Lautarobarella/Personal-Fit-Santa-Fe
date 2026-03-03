"use client"

import { AttendanceActivityDialog } from "@/components/activities/attendance-activity-dialog"
import { ClientDetailsDialog } from "@/components/clients/details-client-dialog"
import { TermsAndConditionsDialog } from "@/components/dashboard/terms-and-conditions-dialog"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Separator } from "@/components/ui/separator"
import { useDashboard } from "@/hooks/dashboard/use-dashboard"
import { UserRole } from "@/types"
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CheckCircle,
  Eye,
  EyeOff,
  Timer,
  Zap
} from "lucide-react"
import { useEffect, useState } from "react"

function DashboardContent() {
  const {
    user,
    mounted,
    isLoading,
    showRevenue,
    setShowRevenue,
    showMonthlyHours,
    setShowMonthlyHours,
    showProfileDialog,
    setShowProfileDialog,
    showTermsDialog,
    trainerAttendanceDialog,
    setTrainerAttendanceDialog,
    stats,
    quickActions,
    alerts,
    handleAcceptTerms,
    handleRejectTerms,
    handleNavigation,
    getMonthlyHours,
  } = useDashboard()

  if (!mounted) {
    return null
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <MobileHeader title="Cargando..." />
        <div className="container-centered py-6 space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Cargando dashboard...</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title={`Hola, ${user.firstName}`} />

      <div className="container-centered h-full py-6 space-y-6">
        {/* Solicitud de permisos de notificación para clientes */}

        {/* Welcome Section - Hero con gradiente naranja */}
        <div className="relative overflow-hidden rounded-3xl shadow-professional-lg">
          {/* Fondo con gradiente naranja */}
          <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 dark:from-primary/90 dark:via-primary/80 dark:to-primary/60 px-6 py-7 rounded-3xl">
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-medium">Bienvenido de vuelta</p>
              <h2 className="text-white text-2xl font-bold mt-1">{user.firstName} {user.lastName}</h2>
              <p className="text-white/70 text-xs mt-2">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            {/* Decoración circular sutil */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -right-10 w-24 h-24 bg-white/5 rounded-full" />
          </div>
        </div>

        {/* Alerts Section - Diseño profesional */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <Card
                key={index}
                className={`border-l-4 shadow-professional transition-all duration-200 hover:shadow-professional-lg ${alert.type === "warning"
                  ? "border-l-primary hover:bg-background/50"
                  : alert.type === "info"
                    ? "border-l-primary hover:bg-background/50"
                    : "border-l-success bg-success/5 hover:bg-success/10"
                  }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-primary flex-shrink-0" />}
                      {alert.type === "info" && <Bell className="h-4 w-4 text-primary flex-shrink-0" />}
                      {alert.type === "success" && <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />}
                      <span className="text-sm font-semibold text-foreground flex-1">{String(alert.message ?? '')}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-xs font-medium hover:bg-background/50 rounded-xl flex-shrink-0 ${!alert.action ? 'hidden' : ''}`}
                      onClick={() => alert.onClick ? alert.onClick() : handleNavigation(alert.route ?? '', alert.action ?? '')}
                    >
                      {String(alert.action ?? '')}
                      <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => {
            const colSpan = (index === 0 || index === 3) ? "col-span-2" : "col-span-1";

            return (
              <Card key={index} className={`relative overflow-hidden shadow-professional hover:shadow-professional-lg transition-all duration-300 border-0 min-h-[160px] flex flex-col justify-center ${colSpan} ${
                stat.color === "success" ? "bg-green-50 dark:bg-green-950/30" :
                stat.color === "destructive" ? "bg-red-50 dark:bg-red-950/30" :
                index % 2 === 0 ? "bg-card" : "bg-muted/40 dark:bg-muted/20"
              }`}>
                {/* Barra lateral de acento */}
                <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${
                  stat.color === "success" ? "bg-green-500" :
                  stat.color === "destructive" ? "bg-red-500" :
                  stat.color === "bg-orange-500" ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                }`} />

                <CardContent className="p-5 pl-5 flex flex-col justify-center h-full">

                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    <div className={`p-1.5 rounded-lg ${
                      stat.color === "success" ? "bg-green-100 dark:bg-green-900/40" :
                      stat.color === "destructive" ? "bg-red-100 dark:bg-red-900/40" :
                      stat.color === "bg-orange-500" ? "bg-primary/10" : "bg-gray-100 dark:bg-gray-800"
                    }`}>
                      <stat.icon className={`h-5 w-5 ${
                        stat.color === "success" ? "text-green-600 dark:text-green-400" :
                        stat.color === "destructive" ? "text-red-600 dark:text-red-400" :
                        stat.color === "bg-orange-500" ? "text-primary" : "text-gray-500 dark:text-gray-400"
                      }`} />
                    </div>
                    {(stat as any).isRevenue && (
                      <button
                        onClick={() => setShowRevenue(!showRevenue)}
                        className="p-1 hover:bg-muted rounded-full transition-colors"
                        aria-label={showRevenue ? "Ocultar ingresos" : "Mostrar ingresos"}
                      >
                        {showRevenue ? (
                          <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="pr-16">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">{String(stat.title ?? '')}</p>
                    <p className={`${stat.dynamicFontSize || "text-3xl"} font-bold ${
                      stat.color === "success" ? "text-green-700 dark:text-green-400" :
                      stat.color === "destructive" ? "text-red-700 dark:text-red-400" :
                      stat.color === "bg-orange-500" ? "text-primary" : "text-foreground"
                    } mb-2 tracking-tight`}>{String(stat.value ?? '')}</p>
                    <p className={`text-xs font-medium ${stat.color === "success" ? "text-green-600 dark:text-green-500" : stat.color === "destructive" ? "text-red-600 dark:text-red-500" : "text-muted-foreground"}`}>{String(stat.description ?? '')}</p>
                  </div>

                  {/* Elemento decorativo naranja */}
                  <div className={`absolute bottom-0 left-0 w-full h-0.5 ${
                    stat.color === "bg-orange-500" ? "bg-primary/40" : "bg-gray-200 dark:bg-gray-700"
                  }`} />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions - Diseño profesional */}
        <Card className="shadow-professional border-0 overflow-hidden">
          {/* Header con acento naranja */}
          <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent dark:from-primary/10 dark:via-primary/5 dark:to-transparent">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/15 dark:bg-primary/20 rounded-xl shadow-sm">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
          </div>
          <CardContent className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              if (action.onClick) {
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={`w-full h-auto p-6 flex flex-col gap-4 border-2 bg-background hover:bg-accent/50 shadow-professional hover:shadow-professional-lg transition-all duration-300 rounded-2xl group ${
                      action.color === "bg-orange-500"
                        ? "border-primary/20 hover:border-primary/50"
                        : "border-border/50 hover:border-gray-400/50 dark:hover:border-gray-500/50"
                    }`}
                    onClick={action.onClick}
                    disabled={(action as any).disabled}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-professional group-hover:scale-110 transition-transform duration-300 ${
                      action.color === "bg-orange-500" ? "bg-primary" : "bg-gray-400 dark:bg-gray-600"
                    }`}>
                      <action.icon className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{String(action.title ?? '')}</span>
                  </Button>
                )
              } else {
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={`w-full h-auto p-6 flex flex-col gap-4 border-2 bg-background hover:bg-accent/50 shadow-professional hover:shadow-professional-lg transition-all duration-300 rounded-2xl group ${
                      action.color === "bg-orange-500"
                        ? "border-primary/20 hover:border-primary/50"
                        : "border-border/50 hover:border-gray-400/50 dark:hover:border-gray-500/50"
                    }`}
                    onClick={() => handleNavigation(action.route!, action.title)}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-professional group-hover:scale-110 transition-transform duration-300 ${
                      action.color === "bg-orange-500" ? "bg-primary" : "bg-gray-400 dark:bg-gray-600"
                    }`}>
                      <action.icon className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{String(action.title ?? '')}</span>
                  </Button>
                )
              }
            })}
          </CardContent>
        </Card>
      </div>

      <BottomNav />

      {/* Dialog de perfil para clientes */}
      {user?.role === UserRole.CLIENT && user.id && (
        <ClientDetailsDialog
          _open={showProfileDialog}
          onOpenChange={setShowProfileDialog}
          userId={user.id}
        />
      )}

      {/* Dialog de términos y condiciones */}
      <TermsAndConditionsDialog
        open={showTermsDialog}
        onAccept={handleAcceptTerms}
        onReject={handleRejectTerms}
      />

      {/* Dialog de asistencia para entrenador */}
      {trainerAttendanceDialog.activityId && (
        <AttendanceActivityDialog
          open={trainerAttendanceDialog.open}
          onOpenChange={(open) => setTrainerAttendanceDialog({ open, activityId: open ? trainerAttendanceDialog.activityId : null })}
          activityId={trainerAttendanceDialog.activityId}
        />
      )}

      {/* Dialog de horas mensuales */}
      {showMonthlyHours && (
        <Dialog open={showMonthlyHours} onOpenChange={setShowMonthlyHours}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Horas del mes - {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              {(() => {
                const monthlyData = getMonthlyHours();
                const totalMonth = monthlyData.reduce((sum, d) => sum + d.totalHours, 0);
                const daysWithHours = monthlyData.filter(d => d.totalHours > 0);
                return (
                  <>
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
                      <span className="text-sm font-semibold">Total del mes</span>
                      <span className="text-lg font-bold">{totalMonth.toFixed(1)} hs</span>
                    </div>
                    <Separator />
                    {daysWithHours.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No hay horas registradas este mes.</p>
                    ) : (
                      daysWithHours.map((day) => {
                        const [y, m, d] = day.date.split('-').map(Number);
                        const dateObj = new Date(y, m - 1, d);
                        const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                        return (
                          <div key={day.date} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                            <span className="text-sm capitalize">{dayName}</span>
                            <span className="text-sm font-semibold">{day.totalHours.toFixed(1)} hs</span>
                          </div>
                        );
                      })
                    )}
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Componente principal que se renderiza solo en el cliente
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <DashboardContent />
}
