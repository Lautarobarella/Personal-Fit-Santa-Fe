"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { MobileHeader } from "@/components/ui/mobile-header"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Clock, Users, MapPin, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { DeleteActivityDialog } from "@/components/activities/delete-activity-dialog"
import { mockActivities } from "@/mocks/mockActivities"

export default function ActivitiesPage() {
  const { user } = useAuth()
  const [activities] = useState(mockActivities)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    activity: (typeof mockActivities)[0] | null
  }>({
    open: false,
    activity: null,
  })

  if (!user) return null

  const canManageActivities = user.role === "administrator" || user.role === "trainer"
  const userActivities =
    user.role === "trainer" ? activities.filter((activity) => activity.trainerId === user.id) : activities

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const handleDeleteActivity = (activity: (typeof mockActivities)[0]) => {
    setDeleteDialog({
      open: true,
      activity,
    })
  }

  const handleConfirmDelete = (activityId: string) => {
    // Here you would call your delete API
    console.log("Deleting activity:", activityId)
    // For demo purposes, we'll just close the dialog
    setDeleteDialog({ open: false, activity: null })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader
        title="Actividades"
        actions={
          canManageActivities ? (
            <Link href="/activities/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nueva
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="container py-6 space-y-4">
        {userActivities.map((activity) => (
          <Card key={activity.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{activity.name}</CardTitle>
                  <CardDescription className="mt-1">{activity.description}</CardDescription>
                </div>
                {canManageActivities && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/activities/${activity.id}/edit`}>Editar</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Ver Asistencia</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteActivity(activity)}>
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(activity.date)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(activity.date)} ({activity.duration}min)
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {activity.currentParticipants}/{activity.maxParticipants}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{activity.trainer}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {user.role === "client" && (
                  <Button className="flex-1">
                    {activity.participants.includes(user.id) ? "Inscrito" : "Inscribirse"}
                  </Button>
                )}
                {canManageActivities && (
                  <>
                    <Button variant="outline" className="flex-1 bg-transparent">
                      Ver Detalles
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {userActivities.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay actividades</h3>
              <p className="text-muted-foreground mb-4">
                {canManageActivities
                  ? "Crea tu primera actividad para comenzar"
                  : "No hay actividades disponibles en este momento"}
              </p>
              {canManageActivities && (
                <Link href="/activities/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Actividad
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      {deleteDialog.activity && (
        <DeleteActivityDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, activity: null })}
          activity={deleteDialog.activity}
          onDelete={handleConfirmDelete}
        />
      )}
      <BottomNav />
    </div>
  )
}
