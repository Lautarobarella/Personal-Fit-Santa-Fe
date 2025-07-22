"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Activity } from "lucide-react"

// Mock data
const mockClient = {
  id: "1",
  name: "María González",
}

const mockActivities = [
  {
    id: "1",
    name: "Yoga Matutino",
    trainer: "Ana García",
    date: new Date("2024-01-15T09:00:00"),
    duration: 60,
    status: "enrolled",
    attendance: null,
    enrollmentDate: new Date("2024-01-10"),
  },
  {
    id: "2",
    name: "CrossFit Avanzado",
    trainer: "Carlos López",
    date: new Date("2024-01-12T18:00:00"),
    duration: 45,
    status: "completed",
    attendance: "present",
    enrollmentDate: new Date("2024-01-08"),
  },
  {
    id: "3",
    name: "Pilates Intermedio",
    trainer: "María Rodríguez",
    date: new Date("2024-01-10T10:00:00"),
    duration: 50,
    status: "completed",
    attendance: "absent",
    enrollmentDate: new Date("2024-01-05"),
  },
  {
    id: "4",
    name: "Zumba",
    trainer: "Ana García",
    date: new Date("2024-01-08T19:00:00"),
    duration: 60,
    status: "completed",
    attendance: "present",
    enrollmentDate: new Date("2024-01-03"),
  },
  {
    id: "5",
    name: "Spinning",
    trainer: "Carlos López",
    date: new Date("2024-01-05T07:00:00"),
    duration: 45,
    status: "cancelled",
    attendance: null,
    enrollmentDate: new Date("2024-01-01"),
  },
]

export default function ClientActivitiesPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [client] = useState(mockClient)
  const [activities] = useState(mockActivities)

  if (!user || (user.role !== "admin" && user.role !== "trainer")) {
    return <div>No tienes permisos para ver esta información</div>
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const enrolledActivities = activities.filter((a) => a.status === "enrolled")
  const completedActivities = activities.filter((a) => a.status === "completed")
  const cancelledActivities = activities.filter((a) => a.status === "cancelled")

  const attendanceRate =
    completedActivities.length > 0
      ? Math.round(
          (completedActivities.filter((a) => a.attendance === "present").length / completedActivities.length) * 100,
        )
      : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enrolled":
        return "default"
      case "completed":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "enrolled":
        return "Inscrita"
      case "completed":
        return "Completada"
      case "cancelled":
        return "Cancelada"
      default:
        return status
    }
  }

  const getAttendanceColor = (attendance: string | null) => {
    switch (attendance) {
      case "present":
        return "text-green-600"
      case "absent":
        return "text-red-600"
      case "late":
        return "text-orange-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getAttendanceText = (attendance: string | null) => {
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

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title={`Actividades - ${client.name}`} showBack onBack={() => router.back()} />

      <div className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{activities.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{completedActivities.length}</div>
              <div className="text-sm text-muted-foreground">Completadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{attendanceRate}%</div>
              <div className="text-sm text-muted-foreground">Asistencia</div>
            </CardContent>
          </Card>
        </div>

        {/* Activities Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="enrolled">Inscritas</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
            <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {activities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{activity.name}</h3>
                      <p className="text-sm text-muted-foreground">{activity.trainer}</p>
                    </div>
                    <Badge variant={getStatusColor(activity.status)}>{getStatusText(activity.status)}</Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(activity.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTime(activity.date)} ({activity.duration}min)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Inscrita: {formatDate(activity.enrollmentDate)}</div>
                      {activity.status === "completed" && (
                        <div className={`font-medium ${getAttendanceColor(activity.attendance)}`}>
                          {getAttendanceText(activity.attendance)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="enrolled" className="space-y-3 mt-4">
            {enrolledActivities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{activity.name}</h3>
                      <p className="text-sm text-muted-foreground">{activity.trainer}</p>
                    </div>
                    <Badge variant="default">Inscrita</Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(activity.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTime(activity.date)} ({activity.duration}min)
                        </span>
                      </div>
                    </div>

                    <div className="text-muted-foreground">Inscrita: {formatDate(activity.enrollmentDate)}</div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      Ver Detalles
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1">
                      Cancelar Inscripción
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {enrolledActivities.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay actividades inscritas</h3>
                  <p className="text-muted-foreground">El cliente no tiene actividades próximas</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 mt-4">
            {completedActivities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{activity.name}</h3>
                      <p className="text-sm text-muted-foreground">{activity.trainer}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">Completada</Badge>
                      <div className={`text-sm font-medium mt-1 ${getAttendanceColor(activity.attendance)}`}>
                        {getAttendanceText(activity.attendance)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(activity.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTime(activity.date)} ({activity.duration}min)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-3 mt-4">
            {cancelledActivities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-muted-foreground">{activity.name}</h3>
                      <p className="text-sm text-muted-foreground">{activity.trainer}</p>
                    </div>
                    <Badge variant="destructive">Cancelada</Badge>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(activity.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTime(activity.date)} ({activity.duration}min)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {cancelledActivities.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No hay actividades canceladas</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
