"use client"

import { DeleteActivityDialog } from "@/components/activities/delete-activity-dialog"
import { DetailsActivityDialog } from "@/components/activities/details-activity-dialog"
import { EnrollActivityDialog } from "@/components/activities/enroll-activity-dialog"
import { TakeAttendanceDialog } from "@/components/activities/take-attendance-dialog"
import { useActivitiesPage } from "@/hooks/activities/use-activities-page"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ActivityStatus, ActivityType, UserRole } from "@/types"
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react"


export default function ActivitiesPage() {
  const {
    user,
    loading,
    searchTerm,
    setSearchTerm,
    filterTrainer,
    setFilterTrainer,
    deleteDialog,
    setDeleteDialog,
    enrollDialog,
    setEnrollDialog,
    attendanceDialog,
    setAttendanceDialog,
    detailsDialog,
    setDetailsDialog,
    canManageActivities,
    isTrainer,
    trainerFullName,
    weekDates,
    dayNames,
    weekActivities,
    activitiesByDay,
    trainers,
    formatTime,
    formatWeekRange,
    isToday,
    getClientActionLabel,
    isClientActionDisabled,
    getClientActionVariant,
    navigateWeek,
    goToToday,
    handleDeleteActivity,
    handleConfirmDelete,
    handleConfirmEnroll,
    handleAttendanceActivity,
    handleDetailsClick,
    handleClientPrimaryAction,
    router,
  } = useActivitiesPage()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const getActivityStatusBadge = (activity: ActivityType) => {
    switch (activity.status) {
      case ActivityStatus.COMPLETED:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Finalizada
          </Badge>
        )
      case ActivityStatus.CANCELLED:
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">
            <X className="h-3 w-3 mr-1" />
            Cancelada
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <MobileHeader
        title="Actividades"
        actions={
          canManageActivities ? (
              <Button size="sm" onClick={() => {router.push('/activities/new')}}>
                <Plus className="h-4 w-4 mr-1" />
                Nueva
              </Button>
          ) : null
        }
      />

      <div className="container-centered py-6 space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")} className="bg-transparent">
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="text-center">
                  <h2 className="font-semibold text-lg">{formatWeekRange()}</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("es-ES", { year: "numeric" }).format(weekDates[0])}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek("next")}
                  className="bg-transparent"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex justify-center mt-3">
                <Button variant="outline" size="sm" onClick={goToToday} className="bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Hoy
                </Button>
              </div>
            </CardContent>
          </Card>


        {/* Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar actividades o entrenadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-3">
              <Select value={filterTrainer} onValueChange={setFilterTrainer}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Entrenador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los entrenadores</SelectItem>
                  {trainers.map((trainer: string) => (
                    <SelectItem key={trainer} value={trainer}>
                      {trainer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Calendar */}
        <div className="space-y-4">
          {activitiesByDay.map((day, dayIndex) => {
            return (
              <Card key={dayIndex} id={`day-${dayIndex}`} className={isToday(day.date) ? "border-primary shadow-md" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`text-center ${isToday(day.date) ? "text-primary" : ""}`}>
                        <div className="text-sm font-medium">
                          {dayNames[dayIndex]}
                        </div>
                        <div
                          className={`text-2xl font-bold ${isToday(day.date) ? "bg-primary text-primary-foreground rounded-full w-9 h-9 flex items-center justify-center" : ""}`}
                        >
                          {day.date.getDate()}
                        </div>
                      </div>
                      {isToday(day.date) && (
                        <Badge variant="default" className="text-xs">
                          Hoy
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {day.activities.length} {day.activities.length === 1 ? "actividad" : "actividades"}
                    </div>
                  </div>

                  {day.activities.length > 0 ? (
                    <div className="space-y-3">
                      {day.activities.map((activity: ActivityType) => {
                        return (
                          <Card
                            key={activity.id}
                            className={`border-l-4 ${activity.status === ActivityStatus.COMPLETED
                              ? "border-l-gray-300 opacity-75"
                              : "border-l-primary"
                              }`}
                          >
                            <CardContent className="p-4 relative">
                              {canManageActivities && activity.status !== ActivityStatus.COMPLETED && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => router.push(`/activities/edit/${activity.id}`)}>
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleAttendanceActivity(activity)}>
                                      Tomar asistencia
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-error"
                                      onClick={() => handleDeleteActivity(activity)}
                                    >
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              {isTrainer && activity.trainerName === trainerFullName && activity.status !== ActivityStatus.COMPLETED && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDetailsClick(activity)}>
                                      Ver Detalles
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleAttendanceActivity(activity)}>
                                      Tomar asistencia
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 pr-10">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className={`font-semibold text-base ${activity.status === ActivityStatus.COMPLETED ? "text-gray-600" : ""}`}>
                                      {activity.name}
                                    </h3>
                                    {getActivityStatusBadge(activity)}
                                    {/* <Badge variant="outline" className={`text-xs ${getCategoryColor(activity.category)}`}>
                                    {activity.category}
                                  </Badge> */}
                                  </div>
                                  <p className={`text-sm mb-2 ${activity.status === ActivityStatus.COMPLETED ? "text-gray-500" : "text-muted-foreground"}`}>
                                    {activity.description}
                                  </p>

                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      <span>{activity.location}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span className="font-medium text-foreground">{formatTime(activity.date)}</span>
                                      <span>({activity.duration}min)</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {activity.trainerName
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">{activity.trainerName}</span>
                                </div>

                                <div className="flex gap-2">
                                  {user?.role === UserRole.CLIENT && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleClientPrimaryAction(activity)}
                                      disabled={isClientActionDisabled(activity)}
                                      className="text-xs"
                                      variant={getClientActionVariant(activity)}
                                    >
                                      {getClientActionLabel(activity)}
                                    </Button>
                                  )}
                                  {canManageActivities && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDetailsClick(activity)}
                                      className="text-xs bg-transparent"
                                    >
                                      Ver Detalles
                                    </Button>
                                  )}
                                  {isTrainer && activity.trainerName === trainerFullName && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDetailsClick(activity)}
                                      className="text-xs bg-transparent"
                                    >
                                      Ver Detalles
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Capacity Bar */}
                              <div className="mt-3">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>Capacidad</span>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{activity.currentParticipants}/{activity.maxParticipants}</span>
                                  </div>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${activity.currentParticipants >= activity.maxParticipants
                                      ? "bg-destructive"
                                      : activity.currentParticipants / activity.maxParticipants > 0.8
                                        ? "bg-warning"
                                        : "bg-primary"
                                      }`}
                                    style={{
                                      width: `${(activity.currentParticipants / activity.maxParticipants) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay actividades programadas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Weekly Summary */}

        {user?.role === UserRole.ADMIN && <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Resumen de la Semana</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{weekActivities.length}</div>
                <div className="text-sm text-muted-foreground">Actividades</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">
                  {weekActivities.reduce((sum: number, a: ActivityType) => sum + a.currentParticipants, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Participantes</div>
              </div>
            </div>
          </CardContent>
        </Card>}
      </div>

      {/* Dialogs */}
      {deleteDialog.activity && (
        <DeleteActivityDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, activity: null })}
          activity={deleteDialog.activity}
          onDelete={handleConfirmDelete}
        />
      )}
      {enrollDialog.activity && (
        <EnrollActivityDialog
          open={enrollDialog.open}
          onOpenChange={(open) => setEnrollDialog({ open, activity: null, isEnrolled: false })}
          activity={enrollDialog.activity}
          isEnrolled={enrollDialog.isEnrolled}
          onToggleEnrollment={handleConfirmEnroll}
        />
      )}
      {attendanceDialog.activity && (
        <TakeAttendanceDialog
          open={attendanceDialog.open}
          onOpenChange={(open) => setAttendanceDialog({ open, activity: null })}
          activityId={attendanceDialog.activity.id}
        />
      )}
      {detailsDialog.activity && (
        <DetailsActivityDialog
          _open={detailsDialog.open}
          onOpenChange={(open) => setDetailsDialog({ open, activity: null })}
          activityId={detailsDialog.activity.id}
          {...(canManageActivities ? {
            onEdit: () => {
              setDetailsDialog({ open: false, activity: null })
              if (detailsDialog.activity) {
                router.push('/activities/edit/' + detailsDialog.activity.id)
              }
            },
            onDelete: () => {
              setDetailsDialog({ open: false, activity: null })
              if (detailsDialog.activity) {
                handleDeleteActivity(detailsDialog.activity)
              }
            }
          } : {})}
        />
      )}

      <BottomNav />
    </div>
  )
}
