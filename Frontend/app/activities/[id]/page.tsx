"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, Users, MapPin, DollarSign, Edit, Trash2, UserCheck } from "lucide-react"
import { DeleteActivityDialog } from "@/components/activities/delete-activity-dialog"
import Link from "next/link"

// Mock activity data
const mockActivity = {
  id: "1",
  name: "Yoga Matutino",
  description:
    "Clase de yoga para principiantes. Perfecta para comenzar el día con energía y relajación. Incluye técnicas de respiración y posturas básicas.",
  trainer: "Ana García",
  trainerId: "2",
  date: new Date("2024-01-15T09:00:00"),
  duration: 60,
  maxParticipants: 15,
  currentParticipants: 12,
  price: 25,
  status: "active" as const,
  participants: [
    { id: "3", name: "María González", status: "confirmed" },
    { id: "4", name: "Juan Pérez", status: "confirmed" },
    { id: "5", name: "Ana Martín", status: "pending" },
  ],
}

export default function ActivityDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [activity] = useState(mockActivity)
  const [deleteDialog, setDeleteDialog] = useState(false)

  if (!user) return null

  const canManage = user.role === "administrator" || (user.role === "trainer" && activity.trainerId === user.id)
  const isEnrolled = user.role === "client" && activity.participants.some((p) => p.id === user.id)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const handleDelete = (activityId: string) => {
    console.log("Activity deleted:", activityId)
    router.push("/activities")
  }

  const handleEnroll = () => {
    console.log("Enrolling in activity:", activity.id)
    // Handle enrollment logic
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader
        title="Detalle de Actividad"
        showBack
        onBack={() => router.back()}
        actions={
          canManage ? (
            <div className="flex gap-2">
              <Link href={`/activities/${activity.id}/edit`}>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : null
        }
      />

      <div className="container py-6 space-y-6">
        {/* Main Activity Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{activity.name}</CardTitle>
                <p className="text-muted-foreground">{activity.description}</p>
              </div>
              <Badge variant={activity.status === "active" ? "default" : "secondary"}>
                {activity.status === "active" ? "Activa" : "Inactiva"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(activity.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formatTime(activity.date)} ({activity.duration}min)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{activity.trainer}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>${activity.price}</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {activity.currentParticipants}/{activity.maxParticipants} participantes
                </span>
              </div>
              <div className="w-full max-w-32 bg-muted rounded-full h-2 ml-4">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${(activity.currentParticipants / activity.maxParticipants) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {user.role === "client" && (
                <Button
                  className="flex-1"
                  disabled={isEnrolled || activity.currentParticipants >= activity.maxParticipants}
                  onClick={handleEnroll}
                >
                  {isEnrolled
                    ? "Ya inscrito"
                    : activity.currentParticipants >= activity.maxParticipants
                      ? "Completo"
                      : "Inscribirse"}
                </Button>
              )}
              {canManage && (
                <>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Tomar Asistencia
                  </Button>
                  <Link href={`/activities/${activity.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Participants List */}
        {(canManage || isEnrolled) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Participantes ({activity.participants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activity.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {participant.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{participant.name}</p>
                    </div>
                    <Badge variant={participant.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                      {participant.status === "confirmed" ? "Confirmado" : "Pendiente"}
                    </Badge>
                  </div>
                ))}

                {activity.participants.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No hay participantes inscritos</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Stats for Managers */}
        {canManage && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${activity.price * activity.currentParticipants}
                </div>
                <div className="text-sm text-muted-foreground">Ingresos Estimados</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((activity.currentParticipants / activity.maxParticipants) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Ocupación</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <DeleteActivityDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        activity={activity}
        onDelete={handleDelete}
      />
    </div>
  )
}
