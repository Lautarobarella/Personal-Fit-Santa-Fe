"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClients } from "@/hooks/use-client"
import { ActivityStatus, AttendanceStatus, PaymentStatus, UserRole, UserStatus } from "@/lib/types"
import {
  Activity,
  AlertTriangle,
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
  UserX
} from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "../providers/auth-provider"

interface ClientDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: number
  onEdit?: () => void
  onDeactivate?: () => void
}

export function ClientDetailsDialog({
  open,
  onOpenChange,
  userId,
  onEdit,
  onDeactivate,
}: ClientDetailsDialogProps) {

  const { user } = useAuth()  // los entrenadores van a poder ver los detalles???????????

  const [activeTab, setActiveTab] = useState("profile")
  const { loading, error, loadClientDetail, selectedClient } = useClients()

  useEffect(() => {
    loadClientDetail(userId)
  }, [loadClientDetail])

  if (loading) return <div>Cargando detalles del cliente...</div>
  if (error) return <div>{error}</div>

  const formatDate = (date: Date | string | null | undefined) => {
    try {
      if (!date) return "N/A";
      
      const parsedDate = typeof date === "string" ? new Date(date) : date;
      
      if (isNaN(parsedDate.getTime())) {
        console.warn("Fecha inválida:", date);
        return "N/A";
      }
      
      return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(parsedDate);
    } catch (err) {
      console.error("Error al formatear fecha:", err, date);
      return "N/A";
    }
  }

  const formatFullDate = (date: Date | string | null | undefined): string => {
    try {
      if (!date) return "N/A";

      const parsedDate = typeof date === "string" ? new Date(date) : date;

      if (isNaN(parsedDate.getTime())) {
        console.warn("Fecha inválida:", date);
        return "N/A";
      }

      return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsedDate);
    } catch (err) {
      console.error("Error al formatear fecha:", err, date);
      return "N/A";
    }
  };


  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success"
      case "ACTIVE":
        return "default"
      case "CANCELLED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getActivityStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Completada"
      case "ACTIVE":
        return "Activa"
      case "CANCELLED":
        return "Cancelada"
      default:
        return status
    }
  }

  const getAttendanceColor = (attendance: string | undefined) => {
    switch (attendance) {
      case "PRESENT":
        return "text-green-600"
      case "ABSENT":
        return "text-red-600"
      case "LATE":
        return "text-yellow-600"
      case "PENDING":
        return "text-blue-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getAttendanceText = (attendance: string | undefined) => {
    switch (attendance) {
      case "PRESENT":
        return "Presente"
      case "ABSENT":
        return "Ausente"
      case "LATE":
        return "Tarde"
      case "PENDING":
        return "Pendiente"
      default:
        return "N/A"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "success"
      case "PENDING":
        return "warning"
      case "REJECTED":
        return "destructive"
      case "DEBTOR":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "PAID":
        return "Pagado"
      case "PENDING":
        return "Pendiente"
      case "REJECTED":
        return "Rechazado"
      case "DEBTOR":
        return "Vencido"
      default:
        return status
    }
  }

  const getMethodText = (method: string) => {
    switch (method) {
      case "cash":
        return "Efectivo"
      case "card":
        return "Tarjeta"
      case "transfer":
        return "Transferencia"
      default:
        return method
    }
  }

  // Calculate statistics
  if (!selectedClient) return null

  const presentActivities = selectedClient.listActivity.filter((a) => a.clientStatus === AttendanceStatus.PRESENT || a.clientStatus === AttendanceStatus.LATE)
  const absentActivities = selectedClient.listActivity.filter((a) => a.clientStatus === AttendanceStatus.ABSENT)
  const enrolledActivities = selectedClient.listActivity.filter((a) => a.clientStatus === AttendanceStatus.PENDING)

  const attendanceRate =
    presentActivities.length > 0
      ? Math.round(
        (presentActivities.length / presentActivities.length + absentActivities.length) * 100,
      )
      : 0

  const completedPayments = selectedClient.listPayments.filter((p) => p.status === PaymentStatus.PAID)
  const pendingPayments = selectedClient.listPayments.filter((p) => p.status === PaymentStatus.PENDING)
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg">
                  {`${selectedClient.firstName[0] ?? ""}${selectedClient.lastName[0] ?? ""}`}
                </AvatarFallback>
              </Avatar>
              <div>

                <DialogTitle className="text-xl flex">{selectedClient.firstName + " " + selectedClient.lastName}</DialogTitle>
                <div className="flex items-center justify-between gap-2">
                  <DialogDescription>{selectedClient.email}</DialogDescription>
                  <Badge variant={selectedClient.status === UserStatus.ACTIVE ? "default" : "secondary"}>
                    {selectedClient.status === UserStatus.ACTIVE ? "Activo" : "Inactivo"}
                  </Badge>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 overflow-hidden mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="activities">Actividades</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="h-full overflow-y-auto space-y-4 mt-4">

            {/* Personal Information */}
            <Card>
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
                      <span className="text-muted-foreground text-sm">Rol:</span>
                      <p className="text-sm mt-1 flex items-start gap-1">
                        <Dice3 className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {selectedClient.role === UserRole.CLIENT && "Cliente"}
                          {selectedClient.role === UserRole.TRAINER && "Entrenador"}
                          {selectedClient.role === UserRole.ADMIN && "Administrador"}
                        </span>
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="h-full overflow-y-auto space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Historial de Actividades</h3>
              <div className="flex gap-2">
                <Badge variant="success">{presentActivities.length} Completadas</Badge>
                <Badge variant="default">{enrolledActivities.length} Inscritas</Badge>
              </div>
            </div>

            <div className="space-y-2">
              {selectedClient.listActivity.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No hay actividades registradas</p>
                  </CardContent>
                </Card>
              )}

              {selectedClient.listActivity.map((activity) => (
                <Card key={activity.id}>
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
          <TabsContent value="payments" className="h-full overflow-y-auto space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Historial de Pagos</h3>
              {/* <div className="flex gap-2">
                <Badge variant="success">${totalPaid} Pagado</Badge>
                {totalPending > 0 && <Badge variant="warning">${totalPending} Pendiente</Badge>}
              </div> */}
            </div>

            <div className="space-y-2">
              {selectedClient.listPayments.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No hay pagos registrados</p>
                  </CardContent>
                </Card>
              )}

              {selectedClient.listPayments.map((payment) => (
                <Card key={payment.id}>
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
          <TabsContent value="stats" className="h-full overflow-y-auto space-y-4 mt-4">
            <div className="space-y-4">
              {/* Activity Stats */}
              <Card className="min-h-[160px]">
                <CardHeader className="py-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Estadísticas de Actividad
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <div className="text-xl font-bold text-primary">{selectedClient.listActivity.length}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-success">{presentActivities.length}</div>
                      <div className="text-xs text-muted-foreground">Presente</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-warning">{enrolledActivities.length}</div>
                      <div className="text-xs text-muted-foreground">Inscritas</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-warning">{attendanceRate}%</div>
                      <div className="text-xs text-muted-foreground">Asistencia</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Stats */}
              <Card className="min-h-[160px]">
                <CardHeader className="py-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Estadísticas Financieras
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <div className="text-xl font-bold text-success">${totalPaid}</div>
                      <div className="text-xs text-muted-foreground">Total Pagado</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-success">{selectedClient.listPayments.length}</div>
                      <div className="text-xs text-muted-foreground">Transacciones</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Summary */}
              <Card className="min-h-[160px]">
                <CardHeader className="py-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Resumen del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Cliente desde:</span>
                      <p className="font-medium text-sm">{formatDate(selectedClient.joinDate)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Última actividad:</span>
                      <p className="font-medium text-sm">{selectedClient.lastActivity ? formatDate(selectedClient.lastActivity) : "No posee"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Promedio mensual:</span>
                      <p className="font-medium text-sm">
                        {Math.round(
                          presentActivities.length / selectedClient.listActivity.length,
                        )}{" "}
                        actividades
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Estado:</span>
                      <Badge variant={selectedClient.status === UserStatus.ACTIVE ? "success" : "secondary"} className="ml-2">
                        {selectedClient.status === UserStatus.ACTIVE ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>

                  {/* Payment Alerts */}
                  {totalPending > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium text-red-800">Pagos pendientes:</span>
                          <p className="text-sm text-red-700">${totalPending} en pagos por cobrar</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
