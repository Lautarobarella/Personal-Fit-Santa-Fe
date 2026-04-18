"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PaymentDetailsDialog } from "@/components/payments/payment-details-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "@/components/ui/user-avatar"
import { getMuscleGroupLabels } from "@/lib/muscle-groups"
import { ActivityStatus, AttendanceStatus, UserRole, UserStatus } from "@/lib/types"
import {
  Activity,
  CakeIcon,
  Calendar,
  Clock,
  CreditCard,
  Dice3,
  DollarSign,
  Edit,
  IdCard,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  User,
  UserX,
  Ambulance
} from "lucide-react"
import { useClientDetailsDialog } from "@/hooks/clients/use-client-details-dialog"

interface ClientDetailsDialogProps {
  _open: boolean
  onOpenChange: (_open: boolean) => void
  userId: number
  onEdit?: () => void
  onDeactivate?: () => void
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
        <DialogContent>
          <DialogTitle className="sr-only">Detalles del cliente</DialogTitle>
          <DialogDescription className="sr-only">Cargando detalles del cliente</DialogDescription>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Cargando detalles del cliente...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle className="sr-only">Error al cargar cliente</DialogTitle>
          <DialogDescription className="sr-only">No se pudieron obtener los detalles del cliente</DialogDescription>
          <div className="text-destructive p-4">{String(error)}</div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!selectedClient) {
    return null
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-hidden">
          <div className="flex flex-col h-full overflow-hidden">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="flex flex-col items-start">
                    <Badge className="mb-1" variant={selectedClient.status === UserStatus.ACTIVE ? "default" : "secondary"}>
                      {selectedClient.status === UserStatus.ACTIVE ? "Activo" : "Inactivo"}
                    </Badge>
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        userId={selectedClient.id}
                        firstName={selectedClient.firstName}
                        lastName={selectedClient.lastName}
                        avatar={selectedClient.avatar}
                        className="h-12 w-12"
                        fallbackClassName="text-lg"
                      />
                      <div>
                        <DialogTitle className="text-xl flex">{selectedClient.firstName + " " + selectedClient.lastName}</DialogTitle>
                        <div className="flex items-center justify-between gap-2">
                          <DialogDescription>{selectedClient.email}</DialogDescription>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {onEdit && (
                    <Button size="sm" variant="outline" onClick={onEdit}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeactivate && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onDeactivate}
                      className="text-destructive hover:text-destructive bg-transparent"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-4 flex min-h-0 w-full flex-1 flex-col overflow-hidden"
          >
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
              <TabsTrigger value="stats" className="px-2 text-xs sm:text-sm" aria-label="Estadisticas">
                <span className="sm:hidden">Est.</span>
                <span className="hidden sm:inline">Estadisticas</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-4 min-h-0 flex-1 overflow-y-auto space-y-4 pr-2 pb-6">

              {/* Personal Information */}
              <Card className="m-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <IdCard className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.dni}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.phone}</span>
                    </div>
                    {selectedClient.emergencyPhone && (
                      <div className="flex items-center gap-2">
                        <Ambulance className="h-4 w-4 text-red-500" />
                        <span className="text-sm">
                          <span className="text-muted-foreground"></span> {selectedClient.emergencyPhone}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.age} años</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CakeIcon className="h-4 w-4 text-muted-foreground" />
                      <span> {formatDate(selectedClient.birthDate)}</span>
                    </div>
                  </div>

                  {selectedClient.address && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-muted-foreground text-sm">Dirección:</span>
                        <p className="text-sm mt-1 flex items-start gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          {selectedClient.address}
                        </p>
                        <span className="text-muted-foreground text-sm">Cliente desde:</span>
                        <p className="text-sm mt-1 flex items-start gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(selectedClient.joinDate)}</span>
                        </p>
                        {user?.role !== UserRole.CLIENT && (
                          <>
                            <span className="text-muted-foreground text-sm">Rol:</span>
                            <p className="text-sm mt-1 flex items-start gap-1">
                              <Dice3 className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {selectedClient.role === UserRole.CLIENT && "Cliente"}
                                {selectedClient.role === UserRole.TRAINER && "Entrenador"}
                                {selectedClient.role === UserRole.ADMIN && "Administrador"}
                              </span>
                            </p>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

            </TabsContent>

            {/* Activities Tab */}
            <TabsContent value="activities" className="mt-4 min-h-0 flex-1 overflow-y-auto space-y-4 pr-2 pb-6">
              <div className="m-2">
                <div className="flex items-center justify-center">
                  <h3 className="text-lg font-semibold text-center">Historial de Actividades</h3>
                </div>
                <div className="flex gap-2 justify-end mt-1">
                  <Badge variant="success">{presentActivities.length} Completadas</Badge>
                  <Badge variant="default">{enrolledActivities.length} Inscritas</Badge>
                </div>
              </div>

              <div className="space-y-2">
                {selectedClient.listActivity.length === 0 && (
                  <Card className="m-2 h-[50vh] flex items-center justify-center">
                    <CardContent className="flex flex-col items-center justify-center h-full">
                      <Activity className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No hay actividades registradas</p>
                    </CardContent>
                  </Card>
                )}

                {selectedClient.listActivity.map((activity) => (
                  <Card key={activity.id} className="m-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{activity.name}</h4>
                          <p className="text-sm text-muted-foreground">Entrenador: {activity.trainerName}</p>
                        </div>
                        <div className="flex items-center gap-2">
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
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(activity.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Intl.DateTimeFormat("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(activity.date ? new Date(activity.date) : new Date())}
                          </span>
                        </div>
                      </div>
                      {/* Mostrar información adicional según el estado */}
                      {activity.activityStatus === ActivityStatus.COMPLETED && (
                        <div className="mt-2 pt-2 border-t border-muted">
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
                            <div className="mt-3 p-3 rounded-md border bg-muted/40 space-y-2">
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
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {activity.summary.trainingDescription}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {activity.activityStatus === ActivityStatus.ACTIVE && activity.clientStatus === AttendanceStatus.PENDING && (
                        <div className="mt-2 pt-2 border-t border-muted">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Estado:</span>
                            <span className="text-blue-600 font-medium">Inscrito - Pendiente</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="mt-4 min-h-0 flex-1 overflow-y-auto space-y-4 pr-2 pb-6">
              <div className="m-2 flex items-center justify-center">
                <h3 className="text-lg font-semibold text-center">Historial de Pagos</h3>
                {/* <div className="flex gap-2">
                <Badge variant="success">${totalPaid} Pagado</Badge>
                {totalPending > 0 && <Badge variant="warning">${totalPending} Pendiente</Badge>}
              </div> */}
              </div>

              <div className="space-y-2">
                {selectedClient.listPayments.length === 0 && (
                  <Card className="m-2 h-[50vh] flex items-center justify-center">
                    <CardContent className="py-8 text-center">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No hay pagos registrados</p>
                    </CardContent>
                  </Card>
                )}

                {selectedClient.listPayments.map((payment) => (
                  <Card
                    key={payment.id}
                    className="m-2 cursor-pointer transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    role="button"
                    tabIndex={0}
                    onClick={() => handlePaymentDetailsClick(payment.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        handlePaymentDetailsClick(payment.id)
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{formatFullDate(payment.createdAt)}</h4>
                          <p className="text-sm text-muted-foreground">Método: {getMethodText(payment.method)}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">${payment.amount}</div>
                          <Badge variant={getPaymentStatusColor(payment.status)} className="text-xs">
                            {getPaymentStatusText(payment.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(payment.expiresAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="mt-4 min-h-0 flex-1 overflow-y-auto space-y-2 pr-2 pb-6">
              <div className="space-y-2">
                {/* Activity Stats */}
                <Card className="m-2">
                  <CardHeader className="py-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Estadísticas de Actividad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 space-y-1">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <div className="text-lg font-bold text-primary">{selectedClient.listActivity.length}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-secondary">{presentActivities.length}</div>
                        <div className="text-xs text-muted-foreground">Presente</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-secondary">{enrolledActivities.length}</div>
                        <div className="text-xs text-muted-foreground">Inscritas</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-primary">{attendanceRate}%</div>
                        <div className="text-xs text-muted-foreground">Asistencia</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Stats */}
                {user?.role !== UserRole.CLIENT && (
                  <Card className="m-2">
                    <CardHeader className="py-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Estadísticas Financieras
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 space-y-1">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div>
                          <div className="text-lg font-bold text-secondary">${totalPaid}</div>
                          <div className="text-xs text-muted-foreground">Total Pagado</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-primary">{selectedClient.listPayments.length}</div>
                          <div className="text-xs text-muted-foreground">Transacciones</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Client Summary */}
                <Card className="m-2">
                  <CardHeader className="py-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Resumen del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 space-y-2 flex flex-col items-center justify-center h-full">
                    <div className="grid grid-cols-2 gap-3 text-sm w-full items-center justify-items-center">
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground text-xs">Estado:</span>
                        <div className="mt-1">
                          <Badge variant={selectedClient.status === UserStatus.ACTIVE ? "success" : "secondary"}>
                            {selectedClient.status === UserStatus.ACTIVE ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground text-xs">Cliente desde:</span>
                        <p className="font-medium text-sm">{formatDate(selectedClient.joinDate)}</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground text-xs">Última actividad:</span>
                        <p className="font-medium text-sm">{lastCompletedActivityDate ? formatDate(lastCompletedActivityDate) : "Sin actividad"}</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground text-xs">Este mes:</span>
                        <p className="font-medium text-sm">{completedActivitiesThisMonth} actividades</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog >

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
