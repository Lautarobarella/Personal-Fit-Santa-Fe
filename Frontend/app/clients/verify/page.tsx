"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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
        <Check className="h-16 w-16 text-success mb-4" />
        <h2 className="text-2xl font-bold mb-2">
          {hasReviewedUsers ? "Verificacion completada" : "No hay usuarios pendientes"}
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
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-muted-foreground">Cargando usuarios pendientes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader title="Usuarios" showBack onBack={() => router.replace("/clients")} />

      <div className="flex-shrink-0 px-3 py-2">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="font-medium">Progreso</span>
          <span className="text-muted-foreground">
            {reviewedCount} completados, {userQueue.length} pendientes
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 mb-2">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{
              width: initialPendingCount.current
                ? `${(reviewedCount / initialPendingCount.current) * 100}%`
                : "0%",
            }}
          />
        </div>
      </div>

      <div className="flex-1 px-3 pb-safe">
        <div className={`transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"} space-y-3 pb-24`}>
          {currentUser && (
            <>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-primary" />
                        {currentUser.firstName} {currentUser.lastName}
                      </h2>
                      <p className="text-sm text-muted-foreground">DNI {currentUser.dni}</p>
                    </div>
                    <Badge variant="warning">Pendiente</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{currentUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{currentUser.phone}</span>
                  </div>
                  {currentUser.emergencyPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>Emergencia: {currentUser.emergencyPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Nacimiento: {formatDate(currentUser.birthDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span>Rol solicitado: {getRoleText(currentUser.role)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Solicitud creada: {formatDate(currentUser.joinDate)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{currentUser.address}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={isProcessing || isOnCooldown || !currentUser}
                  className="w-1/2 py-2 text-sm font-semibold h-9"
                >
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {!isProcessing && <X className="mr-2 h-4 w-4" />}
                  {isOnCooldown ? "Espera..." : "Rechazar"}
                </Button>

                <Button
                  variant="default"
                  onClick={() => handleStatusUpdate("approved")}
                  disabled={isProcessing || isOnCooldown || !currentUser}
                  className="w-1/2 py-2 text-sm font-semibold h-9"
                >
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {!isProcessing && <Check className="mr-2 h-4 w-4" />}
                  {isOnCooldown ? "Espera..." : "Aprobar"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}