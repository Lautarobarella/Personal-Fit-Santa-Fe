"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useUserVerify } from "@/hooks/clients/use-user-verify"
import { UserRole } from "@/types"
import { Check, Clock, Loader2, Mail, MapPin, Phone, ShieldCheck, User, UserCheck, X } from "lucide-react"
import { useEffect } from "react"

export default function UserVerificationPage() {
  const {
    user,
    router,
    loading,
    show,
    isProcessing,
    isOnCooldown,
    reviewedCount,
    userQueue,
    currentUser,
    initialPendingCount,
    isVerificationComplete,
    formatDate,
    getRoleText,
    handleStatusUpdate,
  } = useUserVerify()

  useEffect(() => {
    if (!isVerificationComplete) return

    const timeout = setTimeout(() => {
      router.replace("/clients")
    }, 2000)

    return () => clearTimeout(timeout)
  }, [isVerificationComplete, router])

  if (isVerificationComplete) {
    const hasReviewedUsers = reviewedCount > 0
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <Check className="size-16 text-success mb-4" />
        <h2 className="text-2xl font-bold mb-2">
          {hasReviewedUsers ? "Verificación completada" : "No hay usuarios pendientes"}
        </h2>
        {hasReviewedUsers && (
          <p className="text-muted-foreground mb-6">
            Se revisaron {reviewedCount} usuarios correctamente.
          </p>
        )}
        <Button onClick={() => router.replace("/clients")}>Volver a Clientes</Button>
      </div>
    )
  }

  if (loading || !user || user.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="size-8 animate-spin mb-2" />
        <p className="text-muted-foreground">Cargando usuarios pendientes…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader title="Usuarios" showBack onBack={() => router.replace("/clients")} />

      <div className="container-centered flex-1 space-y-2 py-3 pb-safe">
        {/* Progreso */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
            <span className="font-medium">Progreso</span>
            <span className="text-right text-muted-foreground">
              {reviewedCount} completados, {userQueue.length} pendientes
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{
                width: initialPendingCount.current
                  ? `${(reviewedCount / initialPendingCount.current) * 100}%`
                  : "0%",
              }}
            />
          </div>
        </div>

        <div className={`transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"} space-y-2 pb-24`}>
          {currentUser && (
            <>
              {/* Datos principales del usuario */}
              <div className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <UserCheck className="size-5 shrink-0 text-primary" />
                      <span className="truncate">
                        {currentUser.firstName} {currentUser.lastName}
                      </span>
                    </h2>
                    <p className="text-sm text-muted-foreground">DNI {currentUser.dni}</p>
                  </div>
                  <Badge variant="warning" className="shrink-0">Pendiente</Badge>
                </div>
              </div>

              {/* Datos de contacto y solicitud */}
              <div className="space-y-2 rounded-xl border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <span className="break-all">{currentUser.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0 text-muted-foreground" />
                  <span>{currentUser.phone}</span>
                </div>
                {currentUser.emergencyPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-muted-foreground" />
                    <span>Emergencia: {currentUser.emergencyPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0 text-muted-foreground" />
                  <span>Nacimiento: {formatDate(currentUser.birthDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
                  <span>Rol solicitado: {getRoleText(currentUser.role)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="size-4 shrink-0 text-muted-foreground" />
                  <span>Solicitud creada: {formatDate(currentUser.joinDate)}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                  <span>{currentUser.address}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-3 pt-1">
                <Button
                  variant="secondary"
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={isProcessing || isOnCooldown || !currentUser}
                  className="h-9 flex-1 text-sm font-semibold"
                >
                  {isProcessing && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {!isProcessing && <X className="mr-2 size-4" />}
                  {isOnCooldown ? "Espera…" : "Rechazar"}
                </Button>

                <Button
                  variant="default"
                  onClick={() => handleStatusUpdate("approved")}
                  disabled={isProcessing || isOnCooldown || !currentUser}
                  className="h-9 flex-1 text-sm font-semibold"
                >
                  {isProcessing && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {!isProcessing && <Check className="mr-2 size-4" />}
                  {isOnCooldown ? "Espera…" : "Aprobar"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
