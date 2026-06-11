"use client"

import { esYearFormatter } from "@/lib/formatters"
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
import { cn } from "@/lib/utils"
import { ActivityStatus, ActivityType, UserRole } from "@/types"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Users,
} from "lucide-react"

const getTrainerInitials = (trainerName: string) =>
  trainerName
    .split(" ")
    .map((n: string) => n[0])
    .join("")

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
    canViewDetails,
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
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  const renderActivityCard = (activity: ActivityType) => {
    const isCompleted = activity.status === ActivityStatus.COMPLETED
    const isCancelled = activity.status === ActivityStatus.CANCELLED
    const isClickable = canViewDetails(activity)
    const isFull = activity.currentParticipants >= activity.maxParticipants
    const occupancy = activity.maxParticipants > 0
      ? activity.currentParticipants / activity.maxParticipants
      : 0
    const showAdminMenu = canManageActivities && !isCompleted
    const showTrainerMenu = isTrainer && activity.trainerName === trainerFullName && !isCompleted

    return (
      <Card
        key={activity.id}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={isClickable ? `Ver detalles de ${activity.name}` : undefined}
        onClick={isClickable ? () => handleDetailsClick(activity) : undefined}
        onKeyDown={
          isClickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleDetailsClick(activity)
                }
              }
            : undefined
        }
        className={cn(
          "overflow-hidden transition-colors duration-200",
          isCompleted && "opacity-60",
          isClickable &&
            "cursor-pointer hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Horario */}
            <div className="w-14 shrink-0 border-r pr-3 text-center">
              <p className="text-sm font-semibold leading-none">{formatTime(activity.date)}</p>
              <p className="mt-1 text-[11px] leading-none text-muted-foreground">{activity.duration} min</p>
            </div>

            {/* Nombre y entrenador */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold">{activity.name}</h3>
                {isCancelled && (
                  <Badge variant="destructive" className="shrink-0 text-[10px]">
                    Cancelada
                  </Badge>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Avatar className="size-5">
                  <AvatarFallback className="text-[10px]">
                    {getTrainerInitials(activity.trainerName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{activity.trainerName}</span>
              </div>
            </div>

            {(showAdminMenu || showTrainerMenu) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-2 -mt-2 size-8 shrink-0 p-0"
                    aria-label="Opciones de la actividad"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {showAdminMenu && (
                    <DropdownMenuItem onClick={() => router.push(`/activities/edit/${activity.id}`)}>
                      Editar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleAttendanceActivity(activity)}>
                    Tomar asistencia
                  </DropdownMenuItem>
                  {showAdminMenu && (
                    <DropdownMenuItem
                      className="text-error"
                      onClick={() => handleDeleteActivity(activity)}
                    >
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Capacidad + acción del cliente */}
          <div className="mt-4 flex items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Capacidad</span>
                <span className="flex items-center gap-1 font-medium">
                  <Users className="size-3" />
                  {activity.currentParticipants}/{activity.maxParticipants}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isFull ? "bg-destructive" : occupancy > 0.8 ? "bg-warning" : "bg-primary",
                  )}
                  style={{ width: `${Math.min(occupancy * 100, 100)}%` }}
                />
              </div>
            </div>

            {user?.role === UserRole.CLIENT && (
              <Button
                size="sm"
                variant={getClientActionVariant(activity)}
                disabled={isClientActionDisabled(activity)}
                className="shrink-0 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClientPrimaryAction(activity)
                }}
              >
                {getClientActionLabel(activity)}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <MobileHeader
        title="Actividades"
        actions={
          canManageActivities ? (
            <Button size="sm" onClick={() => router.push("/activities/new")}>
              <Plus className="size-4 mr-1" />
              Nueva
            </Button>
          ) : null
        }
      />

      <div className="container-centered py-6 space-y-6">
        {/* Barra de navegación semanal + filtros */}
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateWeek("prev")}
                className="size-9 shrink-0 p-0"
                aria-label="Semana anterior"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <div className="flex-1 text-center">
                <h2 className="font-semibold leading-tight">{formatWeekRange()}</h2>
                <p className="text-xs text-muted-foreground">
                  {esYearFormatter.format(weekDates[0])}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateWeek("next")}
                className="size-9 shrink-0 p-0"
                aria-label="Semana siguiente"
              >
                <ChevronRight className="size-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={goToToday} className="shrink-0 bg-transparent">
                <CalendarDays className="size-4 mr-1.5" />
                Hoy
              </Button>
            </div>

            <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar actividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterTrainer} onValueChange={setFilterTrainer}>
                <SelectTrigger className="sm:w-56">
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

        {/* Calendario semanal */}
        <div className="space-y-6">
          {activitiesByDay.map((day, dayIndex) => (
            <section key={day.date.toISOString()} id={`day-${dayIndex}`} className="scroll-mt-24">
              <div className="mb-2 flex items-baseline justify-between border-b px-1 pb-2">
                <div className="flex items-baseline gap-2">
                  <h3
                    className={cn(
                      "text-sm font-semibold",
                      isToday(day.date) && "text-primary",
                    )}
                  >
                    {dayNames[dayIndex]} {day.date.getDate()}
                  </h3>
                  {isToday(day.date) && (
                    <Badge variant="outline" className="border-primary text-xs text-primary">
                      Hoy
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {day.activities.length} {day.activities.length === 1 ? "actividad" : "actividades"}
                </span>
              </div>

              {day.activities.length > 0 ? (
                <div className="space-y-3">{day.activities.map(renderActivityCard)}</div>
              ) : (
                <div className="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">
                  Sin actividades programadas
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Resumen semanal (admin) */}
        {user?.role === UserRole.ADMIN && (
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 font-semibold">Resumen de la Semana</h3>
              <div className="grid grid-cols-2 divide-x">
                <div className="px-4 py-2 text-center">
                  <div className="text-2xl font-semibold">{weekActivities.length}</div>
                  <div className="text-sm text-muted-foreground">Actividades</div>
                </div>
                <div className="px-4 py-2 text-center">
                  <div className="text-2xl font-semibold">
                    {weekActivities.reduce((sum: number, a: ActivityType) => sum + a.currentParticipants, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Participantes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
          {...(canManageActivities
            ? {
                onEdit: () => {
                  setDetailsDialog({ open: false, activity: null })
                  if (detailsDialog.activity) {
                    router.push("/activities/edit/" + detailsDialog.activity.id)
                  }
                },
                onDelete: () => {
                  setDetailsDialog({ open: false, activity: null })
                  if (detailsDialog.activity) {
                    handleDeleteActivity(detailsDialog.activity)
                  }
                },
              }
            : {})}
        />
      )}

      <BottomNav />
    </div>
  )
}
