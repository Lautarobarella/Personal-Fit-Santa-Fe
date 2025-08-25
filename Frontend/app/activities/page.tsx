"use client"

import { AttendanceActivityDialog } from "@/components/activities/attendance-activity-dialog"
import { DeleteActivityDialog } from "@/components/activities/delete-activity-dialog"
import { DetailsActivityDialog } from "@/components/activities/details-activity-dialog"
import { EnrollActivityDialog } from "@/components/activities/enroll-activity-dialog"
import { WeeklyScheduleDisplay } from "@/components/activities/weekly-schedule-display"
import { useActivityContext } from "@/contexts/activity-provider"
import { useAuth } from "@/contexts/auth-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ActivityStatus, ActivityType, UserRole } from "@/lib/types"
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
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"


export default function ActivitiesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const {
    activities: allActivities,
    loading,
    error,
    refreshActivities,
    loadActivitiesByWeek,
    enrollInActivity,
    unenrollFromActivity,
    removeActivity,
    isUserEnrolled,
    getActivitiesByWeek,
    getWeekDates,
    canEnrollBasedOnTime,
    canUnenrollBasedOnTime,
    isActivityPast,
    getRegistrationTime,
    getUnregistrationTime,
  } = useActivityContext()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterTrainer, setFilterTrainer] = useState("all")
  const [hasScrolledToToday, setHasScrolledToToday] = useState(false)

  const router = useRouter()
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date()
    // Calcular lunes de la semana actual (domingo no salta a la semana siguiente)
    const diffToMonday = (today.getDay() + 6) % 7 // 0(domingo)->6, 1(lunes)->0, ...
    today.setDate(today.getDate() - diffToMonday)
    today.setHours(0, 0, 0, 0)
    return today
  })

  // Filtrar actividades por la semana actual usando la función del provider
  const activities = useMemo(() => {
    return getActivitiesByWeek(currentWeek)
  }, [allActivities, currentWeek, getActivitiesByWeek])

  // Cargar actividades - carga todas las actividades una vez
  useEffect(() => {
    if (user && allActivities.length === 0) {
      refreshActivities()
    }
  }, [user, allActivities.length, refreshActivities])

  // Auto-scroll al día actual cuando se cargan las actividades
  useEffect(() => {
    if (!loading && !hasScrolledToToday && activities.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Normalizar la hora para comparación

      const currentWeekStart = new Date(currentWeek)
      currentWeekStart.setHours(0, 0, 0, 0)

      const currentWeekEnd = new Date(currentWeek)
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6)
      currentWeekEnd.setHours(23, 59, 59, 999)

      // Solo hacer scroll si hoy está en la semana actual
      if (today >= currentWeekStart && today <= currentWeekEnd) {
        // Buscar el día actual en el array weekDates
        const todayIndex = weekDates.findIndex(date =>
          date.toDateString() === today.toDateString()
        )

        if (todayIndex === -1) {
          return
        }

        // Usar setTimeout para asegurar que el DOM esté completamente renderizado
        setTimeout(() => {
          const targetElement = document.getElementById(`day-${todayIndex}`)

          if (targetElement) {
            // Scroll para que el día aparezca en la parte superior con un margen
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest'
            })

            setHasScrolledToToday(true)
          }
        }, 200)
      }
    }
  }, [loading, activities, hasScrolledToToday, currentWeek])

  // Resetear el flag de scroll cuando cambia la semana
  useEffect(() => {
    setHasScrolledToToday(false)
  }, [currentWeek])

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    activity: ActivityType | null
  }>({
    open: false,
    activity: null,
  })
  const [enrollDialog, setEnrollDialog] = useState<{
    open: boolean
    activity: ActivityType | null
    isEnrolled: boolean
  }>({
    open: false,
    activity: null,
    isEnrolled: false,
  })
  const [attendanceDialog, setAttendanceDialog] = useState<{
    open: boolean
    activity: ActivityType | null
  }>({
    open: false,
    activity: null,
  })
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean
    activity: ActivityType | null
  }>({
    open: false,
    activity: null,
  })

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const canManageActivities = user.role === UserRole.ADMIN
  const weekDates = getWeekDates(currentWeek)
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  // Filter activities (ya viene filtrado por semana desde getActivitiesByWeek)
  const weekActivities = activities.filter((activity: ActivityType) => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTrainer = filterTrainer === "all" || activity.trainerName === filterTrainer

    return matchesSearch && matchesTrainer
  })

  // Group activities by day
  const activitiesByDay = getActivitiesByDay(weekActivities, weekDates)

  // Función unificada para agrupar actividades por día
  function getActivitiesByDay(activities: typeof weekActivities, weekDates: Date[]) {
    return weekDates.map((date) => {
      const dayActivities = activities
        .filter((activity: ActivityType) => {
          const activityDate = new Date(activity.date)

          // Normalizar ambas fechas para comparación precisa
          const normalizedActivityDate = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate())
          const normalizedWeekDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

          return normalizedActivityDate.getTime() === normalizedWeekDate.getTime()
        })
        .sort((a: ActivityType, b: ActivityType) => new Date(a.date).getTime() - new Date(b.date).getTime())

      return {
        date,
        activities: dayActivities,
      }
    })
  }

  // Get unique categories and trainers for filters
  const trainers = [...new Set(activities.map((a: ActivityType) => a.trainerName))]

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
    }).format(date)
  }

  const formatWeekRange = () => {
    const start = weekDates[0]
    const end = weekDates[6]
    return `${formatDate(start)} - ${formatDate(end)}`
  }

  const navigateWeek = (direction: "prev" | "next") => {
    // Solo ADMIN y TRAINER pueden navegar por semanas
    if (user?.role === UserRole.CLIENT) return

    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7))

    // Restringir navegación hacia adelante para ADMIN/TRAINER
    const today = new Date()
    const mondayOfThisWeek = new Date(today)
    const diffToMonday = (mondayOfThisWeek.getDay() + 6) % 7
    mondayOfThisWeek.setDate(mondayOfThisWeek.getDate() - diffToMonday)
    mondayOfThisWeek.setHours(0, 0, 0, 0)

    setCurrentWeek(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    const monday = new Date(today)
    const diffToMonday = (monday.getDay() + 6) % 7
    monday.setDate(monday.getDate() - diffToMonday)
    monday.setHours(0, 0, 0, 0)

    setCurrentWeek(monday)
    setHasScrolledToToday(false) // Resetear para que vuelva a hacer scroll

    // Forzar recarga inmediata
    loadActivitiesByWeek(monday)
  }

  const scrollToToday = () => {
    const today = new Date()
    const todayIndex = activitiesByDay.findIndex(day =>
      day.date.toDateString() === today.toDateString()
    )

    if (todayIndex !== -1) {
      const element = document.getElementById(`day-${todayIndex}`)
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        })
      }
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
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

  const handleDeleteActivity = (activity: ActivityType) => {
    setDeleteDialog({
      open: true,
      activity,
    })
  }

  const handleConfirmDelete = async (activityId: number) => {
    try {
      const result = await removeActivity(activityId)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar la actividad",
        variant: "destructive",
      })
    } finally {
      setDeleteDialog({ open: false, activity: null })
    }
  }

  const handleEnrollActivity = async (activity: ActivityType) => {
    // Prevenir inscripción en actividades completadas o canceladas
    if (activity.status === ActivityStatus.COMPLETED || activity.status === ActivityStatus.CANCELLED) {
      toast({
        title: "No disponible",
        description: `No puedes inscribirte en una actividad ${activity.status === ActivityStatus.COMPLETED ? 'finalizada' : 'cancelada'}.`,
        variant: "destructive",
      })
      return
    }

    // Verificar restricciones para clientes
    if (user?.role === UserRole.CLIENT) {
      try {
        if (user.status !== "ACTIVE") {
          toast({
            title: "Membresía requerida",
            description: "Necesitas tener una membresía activa para inscribirte a las actividades. Por favor, realiza el pago de tu membresía.",
            variant: "destructive",
          })
          return
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo verificar el estado de tu membresía. Intenta nuevamente.",
          variant: "destructive",
        })
        return
      }

      // Verificar límites de tiempo
      if (!isUserEnrolled(activity, user.id)) {
        // Para inscripción
        if (!canEnrollBasedOnTime(activity)) {
          const registrationTime = getRegistrationTime()
          toast({
            title: "Tiempo insuficiente",
            description: `Debes inscribirte con al menos ${registrationTime} horas de anticipación.`,
            variant: "destructive",
          })
          return
        }
      } else {
        // Para desinscripción
        if (!canUnenrollBasedOnTime(activity)) {
          const unregistrationTime = getUnregistrationTime()
          toast({
            title: "Tiempo insuficiente",
            description: `Debes desinscribirte con al menos ${unregistrationTime} horas de anticipación.`,
            variant: "destructive",
          })
          return
        }
      }
    }

    setEnrollDialog({
      open: true,
      activity,
      isEnrolled: isUserEnrolled(activity, user.id),
    })
  }

  const handleConfirmEnroll = async (activity: ActivityType) => {
    try {
      if (enrollDialog.isEnrolled) {
        const result = await unenrollFromActivity(activity.id, user.id)
        if (result.success) {
          // Mostrar toast de éxito
        }
      } else {
        const result = await enrollInActivity(activity.id, user.id)
        if (result.success) {
          // Mostrar toast de éxito
        }
      }
    } catch (error) {
      console.error("Error al manejar inscripción:", error)
    }

    setEnrollDialog({ open: false, activity: null, isEnrolled: false })
  }

  const handleAttendanceActivity = (activity: ActivityType) => {
    setAttendanceDialog({
      open: true,
      activity,
    })
  }

  const handleDetailsClick = (activity: ActivityType) => {
    setDetailsDialog({
      open: true,
      activity,
    })
  }

  return (
    <div className="min-h-screen bg-background pb-32">
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

                {/* Solo mostrar flecha hacia adelante si no estamos en la semana actual */}
                {(() => {
                  const today = new Date()
                  const mondayOfThisWeek = new Date(today)
                  const diffToMonday = (mondayOfThisWeek.getDay() + 6) % 7
                  mondayOfThisWeek.setDate(mondayOfThisWeek.getDate() - diffToMonday)
                  mondayOfThisWeek.setHours(0, 0, 0, 0)

                  const nextWeek = new Date(currentWeek)
                  nextWeek.setDate(currentWeek.getDate() + 7)


                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateWeek("next")}
                      className="bg-transparent"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )
                })()}
              </div>

              <div className="flex justify-center mt-3">
                <Button variant="outline" size="sm" onClick={goToToday} className="bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Hoy
                </Button>
              </div>
            </CardContent>
          </Card>

        {/* Client Activities Title y botón Hoy - Solo para CLIENT */}
        {user?.role === UserRole.CLIENT && (
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <h2 className="font-semibold text-lg">Todas las Actividades</h2>
                <p className="text-sm text-muted-foreground">
                  Actividades disponibles por fecha
                </p>
              </div>
              <div className="flex justify-center mt-3">
                <Button variant="outline" size="sm" onClick={scrollToToday} className="bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ir a Hoy
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
            // Para CLIENT, calcular el índice del día de la semana correctamente
            const dayOfWeekIndex = user?.role === UserRole.CLIENT
              ? (day.date.getDay() + 6) % 7  // Convertir domingo=0 a domingo=6, lunes=1 a lunes=0
              : dayIndex

            return (
              <Card key={dayIndex} id={`day-${dayIndex}`} className={isToday(day.date) ? "border-primary shadow-md" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`text-center ${isToday(day.date) ? "text-primary" : ""}`}>
                        <div className="text-sm font-medium">
                          {dayNames[dayOfWeekIndex]}
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
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
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
                                      <Clock className="h-4 w-4" />
                                      <span className="font-medium text-foreground">{formatTime(activity.date)}</span>
                                      <span>({activity.duration}min)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-4 w-4" />
                                      <span>
                                        {activity.currentParticipants}/{activity.maxParticipants}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      <span>{activity.location}</span>
                                    </div>
                                  </div>
                                </div>

                                {canManageActivities && activity.status !== ActivityStatus.COMPLETED && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleDetailsClick(activity)}>
                                        Ver Detalles
                                      </DropdownMenuItem>
                                      <DropdownMenuItem asChild onClick={() => router.push(`/activities/edit/${activity.id}`)}>
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
                                  {user.role === UserRole.CLIENT && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleEnrollActivity(activity)}
                                      disabled={
                                        activity.status === ActivityStatus.COMPLETED ||
                                        activity.status === ActivityStatus.CANCELLED ||
                                        (activity.currentParticipants >= activity.maxParticipants && !isUserEnrolled(activity, user.id))
                                      }
                                      className="text-xs"
                                      variant={
                                        activity.status === ActivityStatus.COMPLETED
                                          ? "secondary"
                                          : isUserEnrolled(activity, user.id)
                                            ? "destructive"
                                            : "default"
                                      }
                                    >
                                      {activity.status === ActivityStatus.COMPLETED
                                        ? "Finalizada"
                                        : activity.status === ActivityStatus.CANCELLED
                                          ? "Cancelada"
                                          : isActivityPast(activity)
                                            ? "Expirada"
                                            : isUserEnrolled(activity, user.id)
                                              ? "Desinscribir"
                                              : activity.currentParticipants >= activity.maxParticipants
                                                ? "Completo"
                                                : "Inscribirse"}
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
                                </div>
                              </div>

                              {/* Capacity Bar */}
                              <div className="mt-3">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>Capacidad</span>
                                  <span>
                                    {Math.round((activity.currentParticipants / activity.maxParticipants) * 100)}%
                                  </span>
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

        {user.role === UserRole.ADMIN && <Card>
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
        <AttendanceActivityDialog
          open={attendanceDialog.open}
          onOpenChange={(open) => setAttendanceDialog({ open, activity: null })}
          activityId={attendanceDialog.activity.id}
        />
      )}
      {detailsDialog.activity && (
        <DetailsActivityDialog
          open={detailsDialog.open}
          onOpenChange={(open) => setDetailsDialog({ open, activity: null })}
          activityId={detailsDialog.activity.id}
          onEdit={() => {
            setDetailsDialog({ open: false, activity: null })
            if (detailsDialog.activity) {
              router.push('/activities/edit/' + detailsDialog.activity.id)
            }
          }}
          onDelete={() => {
            setDetailsDialog({ open: false, activity: null })
            if (detailsDialog.activity) {
              handleDeleteActivity(detailsDialog.activity)
            }
          }}
        />
      )}

      <BottomNav />
    </div>
  )
}


  // const getCategoryColor = (category: string) => {
  //   const colors = {
  //     Bienestar: "bg-green-100 text-green-800 border-green-200",
  //     Fuerza: "bg-red-100 text-red-800 border-red-200",
  //     Cardio: "bg-blue-100 text-blue-800 border-blue-200",
  //     Flexibilidad: "bg-purple-100 text-purple-800 border-purple-200",
  //     Baile: "bg-pink-100 text-pink-800 border-pink-200",
  //     Funcional: "bg-orange-100 text-orange-800 border-orange-200",
  //     Combate: "bg-gray-100 text-gray-800 border-gray-200",
  //     Acuático: "bg-cyan-100 text-cyan-800 border-cyan-200",
  //     Grupal: "bg-yellow-100 text-yellow-800 border-yellow-200",
  //   }
  //   return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  // }