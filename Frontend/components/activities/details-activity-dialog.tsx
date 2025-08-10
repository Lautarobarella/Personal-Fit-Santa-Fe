"use client"

import { act, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar,
  Users,
  MapPin,
  DollarSign,
  User,
  Edit,
  Trash2,
  UserCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  MessageCircleWarningIcon,
  MailWarningIcon,
} from "lucide-react"
import { useActivities } from "@/hooks/use-activity"
import { ActivityStatus, AttendanceStatus } from "@/lib/types"

interface DetailsActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activityId: number
  onEdit?: () => void
  onDelete?: () => void
}

export function DetailsActivityDialog({ open, onOpenChange, activityId, onEdit, onDelete }: DetailsActivityDialogProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const {
    selectedActivity,
    loadActivityDetail,
  } = useActivities()

  useEffect(() => {
    loadActivityDetail(activityId)
  }, [activityId, loadActivityDetail])


  if (!selectedActivity) {
    return null
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date))
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case ActivityStatus.ACTIVE:
        return "success"
      case ActivityStatus.CANCELLED:
        return "destructive"
      case ActivityStatus.COMPLETED:
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case ActivityStatus.ACTIVE:
        return "Activa"
      case ActivityStatus.CANCELLED:
        return "Cancelada"
      case ActivityStatus.COMPLETED:
        return "Completada"
      default:
        return status
    }
  }

  const presentParticipants = selectedActivity.participants.filter((p) => p.status === AttendanceStatus.PRESENT)
  const absentParticipants = selectedActivity.participants.filter((p) => p.status === AttendanceStatus.ABSENT)
  const occupancyRate = Math.round((selectedActivity.currentParticipants / selectedActivity.maxParticipants) * 100)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between mt-4">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2 flex">{selectedActivity.name}</DialogTitle>
              <DialogDescription >{selectedActivity.description}</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge >{getStatusText(selectedActivity.status)}</Badge>
              <div className="flex gap-1">
                {onEdit && (
                  <Button size="sm" variant="outline" onClick={onEdit}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button size="sm" variant="outline" onClick={onDelete} className="text-error bg-transparent">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="attendance">Asistencia</TabsTrigger>
            <TabsTrigger value="details">Detalles</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Basic Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Fecha:</span>
                      <p className="font-medium">{formatDate(selectedActivity.date)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hora:</span>
                      <p className="font-medium">{formatTime(selectedActivity.date)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duración:</span>
                      <p className="font-medium">{selectedActivity.duration} minutos</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <span className="text-muted-foreground text-sm">Entrenador:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {selectedActivity.trainerName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {selectedActivity.trainerName}
                      </span>
                    </div>
                  </div>

                  {selectedActivity.location && (
                    <div>
                      <span className="text-muted-foreground text-sm">Ubicación:</span>
                      <p className="font-medium flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" />
                        Gimnasio principal
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{selectedActivity.currentParticipants}</div>
                      <div className="text-sm text-muted-foreground">Inscritos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">{occupancyRate}%</div>
                      <div className="text-sm text-muted-foreground">Ocupación</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">{presentParticipants.length}</div>
                      <div className="text-sm text-muted-foreground">Confirmados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-error">{absentParticipants.length}</div>
                      <div className="text-sm text-muted-foreground">Pendientes</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Capacidad</span>
                      <span>
                        {selectedActivity.currentParticipants}/{selectedActivity.maxParticipants}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Equipment and Notes 
            {(selectedActivity.equipment?.length || selectedActivity.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Adicional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedActivity.equipment?.length && (
                    <div>
                      <span className="text-muted-foreground text-sm">Equipamiento necesario:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedActivity.equipment.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedActivity.notes && (
                    <div>
                      <span className="text-muted-foreground text-sm">Notas:</span>
                      <p className="text-sm mt-1 p-2 bg-muted rounded">{selectedActivity.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}*/}
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="attendance" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Lista de Participantes</h3>
              <div className="flex gap-2">
                <Badge variant={'success'}>{presentParticipants.length} Presentes</Badge>
                <Badge variant="destructive">{absentParticipants.length} Ausentes</Badge>
              </div>
            </div>

            <div className="space-y-2">
              {selectedActivity.participants.map((p) => (

                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {`${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{p.firstName + " " + p.lastName}</p>
                          {p.createdAt && (
                            <p className="text-xs text-muted-foreground">
                              Inscrito: {formatDateTime(p.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <>
                          {p.status === AttendanceStatus.PRESENT && (
                            <Badge variant={'success'}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Presente
                            </Badge>
                          )}
                          {p.status === AttendanceStatus.ABSENT && (
                            <Badge variant={'destructive'}>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Ausente
                            </Badge>
                          )}
                          {p.status === AttendanceStatus.PENDING && (
                            <Badge variant={'warning'}>
                              <MailWarningIcon className="h-3 w-3 mr-1" />
                              Pendiente
                            </Badge>
                          )}
                        </>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {selectedActivity.participants.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No hay participantes inscritos</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información de Creación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Creado por:</span>
                    <p className="font-medium">{selectedActivity.createdBy || "Sistema"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha de creación:</span>
                    <p className="font-medium">
                      {selectedActivity.createdAt ? formatDateTime(selectedActivity.createdAt) : "No disponible"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Última modificación:</span>
                    <p className="font-medium">
                      {selectedActivity.lastModified ? formatDateTime(selectedActivity.lastModified) : "No modificada"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID de actividad:</span>
                    <p className="font-medium font-mono text-xs">{selectedActivity.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuración Avanzada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <p className="font-medium">{getStatusText(selectedActivity.status)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Capacidad máxima:</span>
                    <p className="font-medium">{selectedActivity.maxParticipants} personas</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duración total:</span>
                    <p className="font-medium">
                      {Math.floor(selectedActivity.duration / 60)}h {selectedActivity.duration % 60}m
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="bg-transparent">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Tomar Asistencia
                  </Button>
                  <Button size="sm" variant="outline" className="bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    Exportar Lista
                  </Button>
                  {onEdit && (
                    <Button size="sm" variant="outline" onClick={onEdit} className="bg-transparent">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Actividad
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
