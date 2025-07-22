"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Activity,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  Edit,
  UserX,
} from "lucide-react"
import { ActivityType, UserType } from "@/lib/types"
import { mockAttendance } from "@/mocks/mockAttendance"
import { mockUsers } from "@/mocks/mockUsers"

interface ClientDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserType
  activities?: ActivityType[]
  payments?: Array<{
    id: string
    activityName: string
    amount: number
    date: Date
    status: string
    method: string
  }>
  onEdit?: () => void
  onDeactivate?: () => void
}

export function ClientDetailsDialog({
  open,
  onOpenChange,
  user,
  activities = [],
  payments = [],
  onEdit,
  onDeactivate,
}: ClientDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("profile")

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }


  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success"
      case "enrolled":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getActivityStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada"
      case "enrolled":
        return "Inscrita"
      case "cancelled":
        return "Cancelada"
      default:
        return status
    }
  }

  const getAttendanceColor = (attendance: string | undefined) => {
    switch (attendance) {
      case "present":
        return "text-success"
      case "absent":
        return "text-error"
      case "late":
        return "text-warning"
      default:
        return "text-muted-foreground"
    }
  }

  const getAttendanceText = (attendance: string | undefined) => {
    switch (attendance) {
      case "present":
        return "Presente"
      case "absent":
        return "Ausente"
      case "late":
        return "Tarde"
      default:
        return "N/A"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success"
      case "pending":
        return "warning"
      case "failed":
        return "destructive"
      case "overdue":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Pagado"
      case "pending":
        return "Pendiente"
      case "failed":
        return "Fallido"
      case "overdue":
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
  const presentActivities = mockAttendance.filter((a) => a.userId === user.id && (a.status === "present" || a.status === "late"))
  const absentActivities = mockAttendance.filter((a) => a.userId === user.id && (a.status === "absent"))
  const enrolledActivities = activities.filter((a) => a.participants.includes(user.id) && (a.status === "active"))

  const attendanceRate =
    presentActivities.length > 0
      ? Math.round(
          (presentActivities.length / presentActivities.length + absentActivities.length) * 100,
        )
      : 0

  const completedPayments = payments.filter((p) => p.status === "completed")
  const pendingPayments = payments.filter((p) => p.status === "pending" || p.status === "overdue")
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl flex">{user.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  {user.email}
                  <Badge variant={user.status === "active" ? "default" : "secondary"}>
                    {user.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </DialogDescription>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="activities">Actividades</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            
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
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Cliente desde {formatDate(user.joinDate)}</span>
                    </div>
                    {user.dateOfBirth && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{user.age} años</span>
                      </div>
                    )}
                  </div>

                  {user.address && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-muted-foreground text-sm">Dirección:</span>
                        <p className="text-sm mt-1 flex items-start gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          {user.address}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Historial de Actividades</h3>
              <div className="flex gap-2">
                <Badge variant="success">{presentActivities.length} Completadas</Badge>
                <Badge variant="default">{enrolledActivities.length} Inscritas</Badge>
              </div>
            </div>

            <div className="space-y-2">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{activity.name}</h4>
                        <p className="text-sm text-muted-foreground">Entrenador: { mockUsers.find(t => t.name && t.id === activity.trainerId)?.name }</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getActivityStatusColor(activity.status)} className="text-xs">
                          {getActivityStatusText(activity.status)}
                        </Badge>
                        {activity.status === "completed" && (
                          <span className={`text-xs font-medium ${getAttendanceColor( mockAttendance.find(a => a.activityId === activity.id)?.status)}`}>
                            {getAttendanceText(mockAttendance.find(a => a.activityId === activity.id)?.status)}
                          </span>
                        )}
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
                          }).format(activity.date)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {activities.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No hay actividades registradas</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Historial de Pagos</h3>
              <div className="flex gap-2">
                <Badge variant="success">${totalPaid} Pagado</Badge>
                {totalPending > 0 && <Badge variant="warning">${totalPending} Pendiente</Badge>}
              </div>
            </div>

            <div className="space-y-2">
              {payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{payment.activityName}</h4>
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
                      <span>{formatDate(payment.date)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {payments.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No hay pagos registrados</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Activity Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Estadísticas de Actividad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{activities.length}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-success">{presentActivities.length}</div>
                      <div className="text-sm text-muted-foreground">Presente</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-warning">{enrolledActivities.length}</div>
                      <div className="text-sm text-muted-foreground">Inscritas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-warning">{attendanceRate}%</div>
                      <div className="text-sm text-muted-foreground">Asistencia</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Estadísticas Financieras
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-success">${totalPaid}</div>
                      <div className="text-sm text-muted-foreground">Total Pagado</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-success">{payments.length}</div>
                      <div className="text-sm text-muted-foreground">Transacciones</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Resumen del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cliente desde:</span>
                    <p className="font-medium">{formatDate(user.joinDate)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Última actividad:</span>
                    <p className="font-medium">{user.lastActivity? formatDate(user.lastActivity) : "No posee"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Promedio mensual:</span>
                    <p className="font-medium">
                      {Math.round(
                        activities.length /
                          Math.max(1, (Date.now() - user.joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30)),
                      )}{" "}
                      actividades
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant={user.status === "active" ? "success" : "secondary"} className="ml-2">
                      {user.status === "active" ? "Activo" : "Inactivo"}
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
