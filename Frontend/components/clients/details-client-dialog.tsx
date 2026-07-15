"use client"

import { esTimeFormatter } from "@/lib/formatters"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PaymentDetailsDialog } from "@/components/payments/payment-details-dialog"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "@/components/ui/user-avatar"
import { getMuscleGroupLabels } from "@/lib/muscle-groups"
import { ActivityStatus, AttendanceStatus, UserRole, UserStatus } from "@/lib/types"
import {
  Activity,
  Ambulance,
  CakeIcon,
  Calendar,
  Clock,
  Copy,
  CreditCard,
  Dice3,
  Edit,
  IdCard,
  Mail,
  MapPin,
  Phone,
  User,
  UserX,
} from "lucide-react"
import { useClientDetailsDialog } from "@/hooks/clients/use-client-details-dialog"

interface ClientDetailsDialogProps {
  _open: boolean
  onOpenChange: (_open: boolean) => void
  userId: number
  onEdit?: () => void
  onDeactivate?: () => void
}

function CopyButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="ml-auto shrink-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
    >
      <Copy className="size-4" />
    </button>
  )
}

export function ClientDetailsDialog({
  _open: isOpen,
  onOpenChange,
  userId,
  onEdit,
  onDeactivate,
}: ClientDetailsDialogProps) {

  const {
    user,
    activeTab,
    setActiveTab,
    visibleSummaryActivityId,
    toggleSummaryVisibility,
    paymentDetailsDialog,
    setPaymentDetailsDialog,
    handlePaymentDetailsClick,
    copyToClipboard,
    loading,
    error,
    selectedClient,
    formatDate,
    formatFullDate,
    getActivityStatusColor,
    getActivityStatusText,
    getAttendanceColor,
    getAttendanceText,
    getPaymentStatusColor,
    getPaymentStatusText,
    getMethodText,
    presentActivities,
    enrolledActivities,
    attendanceRate,
    totalPaid,
    lastCompletedActivityDate,
    completedActivitiesThisMonth,
  } = useClientDetailsDialog(userId, isOpen)

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="lg:max-w-md">
          <DialogTitle className="sr-only">Detalles del cliente</DialogTitle>
          <DialogDescription className="sr-only">Cargando detalles del cliente</DialogDescription>
          <DialogBody className="flex items-center justify-center">
            <div className="animate-spin rounded-full size-8 border-b-2 border-primary"></div>
            <span className="ml-2">Cargando detalles del cliente…</span>
          </DialogBody>
        </DialogContent>
      </Dialog>
    )
  }
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="lg:max-w-md">
          <DialogTitle className="sr-only">Error al cargar cliente</DialogTitle>
          <DialogDescription className="sr-only">No se pudieron obtener los detalles del cliente</DialogDescription>
          <DialogBody className="text-destructive">{String(error)}</DialogBody>
        </DialogContent>
      </Dialog>
    )
  }

  if (!selectedClient) {
    return null
  }

  const activityStatItems = [
    { label: "Total", value: selectedClient.listActivity.length },
    { label: "Presente", value: presentActivities.length },
    { label: "Inscritas", value: enrolledActivities.length },
    { label: "Asistencia", value: `${attendanceRate}%` },
  ]

  const summaryItems = [
    { label: "Cliente desde", value: formatDate(selectedClient.joinDate) },
    {
      label: "Última actividad",
      value: lastCompletedActivityDate ? formatDate(lastCompletedActivityDate) : "Sin actividad",
    },
    { label: "Este mes", value: `${completedActivitiesThisMonth} actividades` },
  ]

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="lg:max-w-3xl">
          <DialogHeader className="pr-14">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  userId={selectedClient.id}
                  firstName={selectedClient.firstName}
                  lastName={selectedClient.lastName}
                  avatar={selectedClient.avatar}
                  className="size-12 shrink-0"
                  fallbackClassName="text-lg"
                />
                <div className="min-w-0">
                  <DialogTitle className="break-words text-xl">
                    {selectedClient.firstName + " " + selectedClient.lastName}
                  </DialogTitle>
                  <DialogDescription className="break-words">{selectedClient.email}</DialogDescription>
                  <Badge
                    className="mt-1.5"
                    variant={selectedClient.status === UserStatus.ACTIVE ? "success" : "secondary"}
                  >
                    {selectedClient.status === UserStatus.ACTIVE ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>

              {(onEdit || onDeactivate) && (
                <div className="flex shrink-0 gap-1.5">
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onEdit}
                      aria-label="Editar cliente"
                      className="bg-transparent"
                    >
                      <Edit className="size-4" />
                    </Button>
                  )}
                  {onDeactivate && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onDeactivate}
                      aria-label="Desactivar cliente"
                      className="text-destructive hover:text-destructive bg-transparent"
                    >
                      <UserX className="size-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

          <DialogBody>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid h-11 w-full grid-cols-4 gap-1">
                <TabsTrigger value="profile" className="px-2 text-xs sm:text-sm">
                  Perfil
                </TabsTrigger>
                <TabsTrigger value="activities" className="px-2 text-xs sm:text-sm" aria-label="Actividades">
                  <span className="sm:hidden">Act.</span>
                  <span className="hidden sm:inline">Actividades</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="px-2 text-xs sm:text-sm">
                  Pagos
                </TabsTrigger>
                <TabsTrigger value="stats" className="px-2 text-xs sm:text-sm" aria-label="Estadísticas">
                  <span className="sm:hidden">Est.</span>
                  <span className="hidden sm:inline">Estadísticas</span>
                </TabsTrigger>
              </TabsList>

              {/* ── Perfil ─────────────────────────────────────────────── */}
              <TabsContent value="profile" className="mt-4 space-y-4">
                <div className="rounded-xl border px-4 py-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <span className="h-5 w-1 rounded-full bg-primary" />
                    Información Personal
                  </h4>
                  <div className="mt-1 divide-y">
                    <div className="flex items-center gap-3 py-2.5 text-sm">
                      <IdCard className="size-4 shrink-0 text-muted-foreground" />
                      <span>{selectedClient.dni}</span>
                      <CopyButton onClick={() => copyToClipboard(selectedClient.dni, "DNI")} label="Copiar DNI" />
                    </div>
                    <div className="flex items-center gap-3 py-2.5 text-sm">
                      <Mail className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 break-words">{selectedClient.email}</span>
                      <CopyButton onClick={() => copyToClipboard(selectedClient.email, "Email")} label="Copiar email" />
                    </div>
                    <div className="flex items-center gap-3 py-2.5 text-sm">
                      <Phone className="size-4 shrink-0 text-muted-foreground" />
                      <span>{selectedClient.phone}</span>
                      <CopyButton onClick={() => copyToClipboard(selectedClient.phone, "Teléfono")} label="Copiar teléfono" />
                    </div>
                    {selectedClient.emergencyPhone && (
                      <div className="flex items-center gap-3 py-2.5 text-sm">
                        <Ambulance className="size-4 shrink-0 text-red-500" />
                        <span>{selectedClient.emergencyPhone}</span>
                        <CopyButton onClick={() => copyToClipboard(selectedClient.emergencyPhone, "Teléfono de emergencia")} label="Copiar teléfono de emergencia" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 py-2.5 text-sm">
                      <User className="size-4 shrink-0 text-muted-foreground" />
                      <span>{selectedClient.age} años</span>
                    </div>
                    <div className="flex items-center gap-3 py-2.5 text-sm">
                      <CakeIcon className="size-4 shrink-0 text-muted-foreground" />
                      <span>{formatDate(selectedClient.birthDate)}</span>
                    </div>
                  </div>
                </div>

                {selectedClient.address && (
                  <div className="rounded-xl border px-4 py-3">
                    <dl className="divide-y">
                      <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                        <dt className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="size-4 shrink-0" />
                          Dirección
                        </dt>
                        <dd className="text-right font-medium">{selectedClient.address}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                        <dt className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="size-4 shrink-0" />
                          Cliente desde
                        </dt>
                        <dd className="text-right font-medium">{formatDate(selectedClient.joinDate)}</dd>
                      </div>
                      {user?.role !== UserRole.CLIENT && (
                        <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                          <dt className="flex items-center gap-2 text-muted-foreground">
                            <Dice3 className="size-4 shrink-0" />
                            Rol
                          </dt>
                          <dd className="text-right font-medium">
                            {selectedClient.role === UserRole.CLIENT && "Cliente"}
                            {selectedClient.role === UserRole.TRAINER && "Entrenador"}
                            {selectedClient.role === UserRole.ADMIN && "Administrador"}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </TabsContent>

              {/* ── Actividades ────────────────────────────────────────── */}
              <TabsContent value="activities" className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">Historial de Actividades</h3>
                  <div className="flex gap-2">
                    <Badge variant="success">{presentActivities.length} Completadas</Badge>
                    <Badge variant="default">{enrolledActivities.length} Inscritas</Badge>
                  </div>
                </div>

                {selectedClient.listActivity.length === 0 ? (
                  <div className="rounded-xl border border-dashed py-10 text-center">
                    <Activity className="mx-auto mb-2 size-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No hay actividades registradas</p>
                  </div>
                ) : (
                  <div className="divide-y rounded-xl border">
                    {selectedClient.listActivity.map((activity) => (
                      <div key={activity.id} className="px-4 py-3">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium">{activity.name}</h4>
                            <p className="text-sm text-muted-foreground">Entrenador: {activity.trainerName}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge variant={getActivityStatusColor(activity.activityStatus)} className="text-xs">
                              {getActivityStatusText(activity.activityStatus)}
                            </Badge>
                            <span className={`text-xs font-medium ${getAttendanceColor(activity.clientStatus)}`}>
                              {getAttendanceText(activity.clientStatus)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            <span>{formatDate(activity.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="size-3" />
                            <span>
                              {esTimeFormatter.format(activity.date ? new Date(activity.date) : new Date())}
                            </span>
                          </div>
                        </div>
                        {/* Mostrar información adicional según el estado */}
                        {activity.activityStatus === ActivityStatus.COMPLETED && (
                          <div className="mt-2 border-t pt-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Asistencia:</span>
                              <span className={`font-medium ${getAttendanceColor(activity.clientStatus)}`}>
                                {getAttendanceText(activity.clientStatus)}
                              </span>
                            </div>
                            <div className="mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-transparent"
                                disabled={!activity.summary}
                                onClick={() => toggleSummaryVisibility(activity.id)}
                              >
                                {visibleSummaryActivityId === activity.id ? "Ocultar resumen" : "Ver resumen"}
                              </Button>
                            </div>
                            {activity.summary && visibleSummaryActivityId === activity.id && (
                              <div className="mt-3 space-y-2 rounded-lg bg-muted/40 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Resumen
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    Esfuerzo {activity.summary.effortLevel}/10
                                  </Badge>
                                </div>
                                <p className="text-sm">
                                  <span className="font-medium">Grupo:</span>{" "}
                                  {getMuscleGroupLabels(
                                    activity.summary.muscleGroups?.length
                                      ? activity.summary.muscleGroups
                                      : activity.summary.muscleGroup
                                        ? [activity.summary.muscleGroup]
                                        : [],
                                  ).join(", ") || "No informado"}
                                </p>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                  {activity.summary.trainingDescription}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {activity.activityStatus === ActivityStatus.ACTIVE && activity.clientStatus === AttendanceStatus.PENDING && (
                          <div className="mt-2 border-t pt-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Estado:</span>
                              <span className="text-blue-600 font-medium">Inscrito - Pendiente</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── Pagos ──────────────────────────────────────────────── */}
              <TabsContent value="payments" className="mt-4 space-y-3">
                <h3 className="font-semibold">Historial de Pagos</h3>

                {selectedClient.listPayments.length === 0 ? (
                  <div className="rounded-xl border border-dashed py-10 text-center">
                    <CreditCard className="mx-auto mb-2 size-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No hay pagos registrados</p>
                  </div>
                ) : (
                  <div className="divide-y overflow-hidden rounded-xl border">
                    {selectedClient.listPayments.map((payment) => (
                      <button
                        key={payment.id}
                        type="button"
                        className="w-full px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
                        onClick={() => handlePaymentDetailsClick(payment.id)}
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium">{formatFullDate(payment.createdAt)}</h4>
                            <p className="text-sm text-muted-foreground">Método: {getMethodText(payment.method)}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-lg font-bold">${payment.amount}</div>
                            <Badge variant={getPaymentStatusColor(payment.status)} className="text-xs">
                              {getPaymentStatusText(payment.status)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="size-3" />
                          <span>{formatDate(payment.expiresAt)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── Estadísticas ───────────────────────────────────────── */}
              <TabsContent value="stats" className="mt-4 space-y-4">
                <div className="rounded-xl border px-4 py-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <span className="h-5 w-1 rounded-full bg-primary" />
                    Estadísticas de Actividad
                  </h4>
                  <div className="mt-2 grid grid-cols-2 divide-x sm:grid-cols-4">
                    {activityStatItems.map(({ label, value }) => (
                      <div key={label} className="px-3 py-3 text-center">
                        <p className="text-xl font-semibold">{value}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {user?.role !== UserRole.CLIENT && (
                  <div className="rounded-xl border px-4 py-3">
                    <h4 className="flex items-center gap-2 text-sm font-semibold">
                      <span className="h-5 w-1 rounded-full bg-primary" />
                      Estadísticas Financieras
                    </h4>
                    <div className="mt-2 grid grid-cols-2 divide-x">
                      <div className="px-3 py-3 text-center">
                        <p className="text-xl font-semibold">${totalPaid}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Total Pagado</p>
                      </div>
                      <div className="px-3 py-3 text-center">
                        <p className="text-xl font-semibold">{selectedClient.listPayments.length}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Transacciones</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border px-4 py-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <span className="h-5 w-1 rounded-full bg-primary" />
                    Resumen del Cliente
                  </h4>
                  <dl className="mt-1 divide-y">
                    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                      <dt className="text-muted-foreground">Estado</dt>
                      <dd className="text-right font-medium">
                        <Badge variant={selectedClient.status === UserStatus.ACTIVE ? "success" : "secondary"}>
                          {selectedClient.status === UserStatus.ACTIVE ? "Activo" : "Inactivo"}
                        </Badge>
                      </dd>
                    </div>
                    {summaryItems.map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="text-right font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </TabsContent>
            </Tabs>
          </DialogBody>
        </DialogContent>
      </Dialog>

      {paymentDetailsDialog.paymentId !== null && (
        <PaymentDetailsDialog
          open={paymentDetailsDialog.open}
          onOpenChange={(open) => setPaymentDetailsDialog({ open, paymentId: open ? paymentDetailsDialog.paymentId : null })}
          paymentId={paymentDetailsDialog.paymentId}
        />
      )}
    </>
  )
}
