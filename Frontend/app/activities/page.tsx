"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { MobileHeader } from "@/components/ui/mobile-header"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, Users, MapPin, MoreVertical, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { DeleteActivityDialog } from "@/components/activities/delete-activity-dialog"
import { EnrollActivityDialog } from "@/components/activities/enroll-activity-dialog"
import { AttendanceActivityDialog } from "@/components/activities/attendance-activity-dialog"
import { DetailsActivityDialog } from "@/components/activities/details-activity-dialog"
import { useActivities } from "@/hooks/use-activity"
import { ActivityType } from "@/lib/types"
import { useRouter } from "next/navigation"


export default function ActivitiesPage() {
  const { user } = useAuth()
  const { 
    activities,
    loading,
    error, 
    loadActivitiesByWeek,
    enrollIntoActivity,
    unenrollFromActivity,
   } = useActivities()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterTrainer, setFilterTrainer] = useState("all")
  const router = useRouter()
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date()
    today.setDate(today.getDate() - today.getDay() + 1) // Primer día de la semana (lunes)
    today.setHours(0, 0, 0, 0)
    return today
  })

  const loadedWeeks = useRef<Set<string>>(new Set())

  useEffect(() => {
    const weekKey = currentWeek.toISOString().slice(0, 10)

    if (!loadedWeeks.current.has(weekKey)) {
      loadedWeeks.current.add(weekKey)
      loadActivitiesByWeek(currentWeek)
    }
  }, [currentWeek, loadActivitiesByWeek])


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

  const canManageActivities = user.role === "admin" || user.role === "trainer"

  // Get week dates (Monday to Sunday)
  const getWeekDates = (startDate: Date) => {
    const dates = []
    const monday = new Date(startDate)
    monday.setDate(startDate.getDate() - startDate.getDay() + 1) // Get Monday

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates(currentWeek)
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  // Filter activities for current week
  const weekActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.date)
    const weekStart = weekDates[0]
    const weekEnd = new Date(weekDates[6])
    weekEnd.setHours(23, 59, 59, 999)
    const matchesWeek = activityDate >= weekStart && activityDate <= weekEnd
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTrainer = filterTrainer === "all" || activity.trainerName === filterTrainer

    return matchesWeek && matchesSearch && matchesTrainer
  })

  // Group activities by day
  const activitiesByDay = weekDates.map((date) => {
    const dayActivities = weekActivities
      .filter((activity) => {
        const activityDate = new Date(activity.date)
        return activityDate.toDateString() === date.toDateString()
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
    return {
      date,
      activities: dayActivities,
    }
  })

  // Get unique categories and trainers for filters
  const trainers = [...new Set(activities.map((a) => a.trainerName))]
  
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
    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7))
    setCurrentWeek(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)
    monday.setHours(0, 0, 0, 0)
    setCurrentWeek(monday)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
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

  const isUserEnrolled = (activity: ActivityType) =>
    activity.participants.some((p) => p === user.id)

  const handleDeleteActivity = (activity: ActivityType) => {
    setDeleteDialog({
      open: true,
      activity,
    })
  }

  const handleConfirmDelete = (activityId: number) => {
    // Here you would call your delete API
    console.log("Deleting activity:", activityId)
    // For demo purposes, we'll just close the dialog
    setDeleteDialog({ open: false, activity: null })
  }

  const handleEnrollActivity = (activity: ActivityType) => {
    setEnrollDialog({
      open: true,
      activity,
      isEnrolled: isUserEnrolled(activity),
    })
  }

  const handleConfirmEnroll = async (activity: ActivityType) => {
    if (enrollDialog.isEnrolled) {
      unenrollFromActivity(activity.id, user.id)
    } else {
      enrollIntoActivity(activity.id, user.id)
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

      <div className="container py-6 space-y-6">
        {/* Week Navigation */}
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

              <Button variant="outline" size="sm" onClick={() => navigateWeek("next")} className="bg-transparent">
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
                  {trainers.map((trainer) => (
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
          {activitiesByDay.map((day, dayIndex) => (
            
            <Card key={dayIndex} className={isToday(day.date) ? "border-primary shadow-md" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`text-center ${isToday(day.date) ? "text-primary" : ""}`}>
                      <div className="text-sm font-medium">{dayNames[dayIndex]}</div>
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
                    {day.activities.map((activity) => (
                      <Card key={activity.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-base">{activity.name}</h3>
                                {/* <Badge variant="outline" className={`text-xs ${getCategoryColor(activity.category)}`}>
                                  {activity.category}
                                </Badge> */}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>

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

                            {canManageActivities && (
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
                                  <DropdownMenuItem asChild>
                                    <Link href={`/activities/${activity.id}/edit`}>Editar</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAttendanceActivity(activity)}>Ver Asistencia</DropdownMenuItem>
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
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{activity.trainerName}</span>
                            </div>

                            <div className="flex gap-2">
                              {user.role === "client" && (
                              <Button
                                size="sm"
                                onClick={() => handleEnrollActivity(activity)}
                                disabled={activity.currentParticipants >= activity.maxParticipants && !isUserEnrolled(activity)}
                                className="text-xs"
                                variant={isUserEnrolled(activity) ? "destructive" : "default"}
                              >
                                {isUserEnrolled(activity)
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
                                className={`h-2 rounded-full transition-all ${
                                  activity.currentParticipants >= activity.maxParticipants
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
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay actividades programadas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly Summary */}

        { user.role === "admin" && <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Resumen de la Semana</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{weekActivities.length}</div>
                <div className="text-sm text-muted-foreground">Actividades</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">
                  {weekActivities.reduce((sum, a) => sum + a.currentParticipants, 0)}
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
            router.push('/activities/' + detailsDialog.activity + '/edit')
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
