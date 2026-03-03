import { useActivityContext } from "@/contexts/activity-provider"
import { useSettingsContext } from "@/contexts/settings-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useToast } from "@/hooks/use-toast"
import { ActivityStatus, ActivityType, UserRole } from "@/types"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export function useActivitiesPage() {
  const { user } = useRequireAuth()
  const { toast } = useToast()
  const { registrationTime, unregistrationTime, maxActivitiesPerDay } = useSettingsContext()
  const {
    activities: allActivities,
    loading,
    refreshActivities,
    loadActivitiesByWeek,
    enrollInActivity,
    unenrollFromActivity,
    removeActivity,
    isUserEnrolled,
    canUserEnrollBasedOnPaymentStatus,
    getActivitiesByWeek,
    getWeekDates,
    canEnrollBasedOnTime,
    canUnenrollBasedOnTime,
    isActivityPast,
  } = useActivityContext()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterTrainer, setFilterTrainer] = useState("all")
  const [hasScrolledToToday, setHasScrolledToToday] = useState(false)

  const router = useRouter()
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date()
    const diffToMonday = (today.getDay() + 6) % 7
    today.setDate(today.getDate() - diffToMonday)
    today.setHours(0, 0, 0, 0)
    return today
  })

  // Filtrar actividades por la semana actual
  const activities = useMemo(() => {
    return getActivitiesByWeek(currentWeek)
  }, [allActivities, currentWeek, getActivitiesByWeek])

  // Cargar actividades
  useEffect(() => {
    if (user && allActivities.length === 0) {
      refreshActivities()
    }
  }, [user, allActivities.length, refreshActivities])

  // Auto-scroll al día actual
  useEffect(() => {
    if (!loading && !hasScrolledToToday && activities.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const currentWeekStart = new Date(currentWeek)
      currentWeekStart.setHours(0, 0, 0, 0)

      const currentWeekEnd = new Date(currentWeek)
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6)
      currentWeekEnd.setHours(23, 59, 59, 999)

      if (today >= currentWeekStart && today <= currentWeekEnd) {
        const weekDates = getWeekDates(currentWeek)
        const todayIndex = weekDates.findIndex(date =>
          date.toDateString() === today.toDateString()
        )

        if (todayIndex === -1) return

        setTimeout(() => {
          const targetElement = document.getElementById(`day-${todayIndex}`)
          if (targetElement) {
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
  }, [loading, activities, hasScrolledToToday, currentWeek, getWeekDates])

  // Reset scroll flag on week change
  useEffect(() => {
    setHasScrolledToToday(false)
  }, [currentWeek])

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    activity: ActivityType | null
  }>({ open: false, activity: null })

  const [enrollDialog, setEnrollDialog] = useState<{
    open: boolean
    activity: ActivityType | null
    isEnrolled: boolean
  }>({ open: false, activity: null, isEnrolled: false })

  const [attendanceDialog, setAttendanceDialog] = useState<{
    open: boolean
    activity: ActivityType | null
  }>({ open: false, activity: null })

  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean
    activity: ActivityType | null
  }>({ open: false, activity: null })

  const canManageActivities = user?.role === UserRole.ADMIN
  const isTrainer = user?.role === UserRole.TRAINER
  const trainerFullName = user ? `${user.firstName} ${user.lastName}` : ''
  const weekDates = getWeekDates(currentWeek)
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  // Filter activities
  const weekActivities = activities.filter((activity: ActivityType) => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTrainer = filterTrainer === "all" || activity.trainerName === filterTrainer
    return matchesSearch && matchesTrainer
  })

  // Group activities by day
  const activitiesByDay = weekDates.map((date) => {
    const dayActivities = weekActivities
      .filter((activity: ActivityType) => {
        const activityDate = new Date(activity.date)
        const normalizedActivityDate = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate())
        const normalizedWeekDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        return normalizedActivityDate.getTime() === normalizedWeekDate.getTime()
      })
      .sort((a: ActivityType, b: ActivityType) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return { date, activities: dayActivities }
  })

  // Trainers for filter
  const trainers = [...new Set(activities.map((a: ActivityType) => a.trainerName))]

  // Helper: count user enrollments for a specific day
  const getUserEnrollmentsForDay = (activityDate: Date, userId: number) => {
    const targetDay = new Date(activityDate)
    targetDay.setHours(0, 0, 0, 0)
    return allActivities.filter((activity: ActivityType) => {
      const activityDay = new Date(activity.date)
      activityDay.setHours(0, 0, 0, 0)
      return activityDay.getTime() === targetDay.getTime() &&
        isUserEnrolled(activity, userId)
    }).length
  }

  const canEnrollInMoreActivitiesForDay = (activityDate: Date, userId: number) => {
    const currentEnrollments = getUserEnrollmentsForDay(activityDate, userId)
    return currentEnrollments < maxActivitiesPerDay
  }

  // Formatters
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

  // Navigation
  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7))
    setCurrentWeek(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    const monday = new Date(today)
    const diffToMonday = (monday.getDay() + 6) % 7
    monday.setDate(monday.getDate() - diffToMonday)
    monday.setHours(0, 0, 0, 0)
    setCurrentWeek(monday)
    setHasScrolledToToday(false)
    loadActivitiesByWeek(monday)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Activity status helpers
  const canSubmitSummary = (activity: ActivityType) => {
    if (!user || user.role !== UserRole.CLIENT) return false
    const isEnrolledInActivity = isUserEnrolled(activity, user.id)
    if (!isEnrolledInActivity || activity.status === ActivityStatus.CANCELLED) return false
    return activity.status === ActivityStatus.COMPLETED || isActivityPast(activity)
  }

  const hasSubmittedSummary = (activity: ActivityType) => {
    if (!user) return false
    return activity.participantsWithSummary?.includes(user.id) ?? false
  }

  const getClientActionLabel = (activity: ActivityType) => {
    if (canSubmitSummary(activity)) {
      return hasSubmittedSummary(activity) ? "Editar resumen" : "Hacer resumen"
    }
    if (activity.status === ActivityStatus.COMPLETED) return "Finalizada"
    if (activity.status === ActivityStatus.CANCELLED) return "Cancelada"
    if (isActivityPast(activity)) return "Expirada"
    if (isUserEnrolled(activity, user?.id || 0)) return "Desinscribir"
    if (activity.currentParticipants >= activity.maxParticipants) return "Completo"
    if (!canEnrollInMoreActivitiesForDay(activity.date, user?.id || 0)) return "Límite diario"
    return "Inscribirse"
  }

  const isClientActionDisabled = (activity: ActivityType) => {
    if (canSubmitSummary(activity)) return false
    return (
      activity.status === ActivityStatus.COMPLETED ||
      activity.status === ActivityStatus.CANCELLED ||
      (isActivityPast(activity) && !isUserEnrolled(activity, user?.id || 0)) ||
      (activity.currentParticipants >= activity.maxParticipants && !isUserEnrolled(activity, user?.id || 0)) ||
      (!isUserEnrolled(activity, user?.id || 0) && !canEnrollInMoreActivitiesForDay(activity.date, user?.id || 0))
    )
  }

  const getClientActionVariant = (activity: ActivityType): "default" | "outline" | "secondary" => {
    if (canSubmitSummary(activity)) {
      return hasSubmittedSummary(activity) ? "outline" : "default"
    }
    if (activity.status === ActivityStatus.COMPLETED) return "secondary"
    return isUserEnrolled(activity, user?.id || 0) ? "outline" : "default"
  }

  // Handlers
  const handleDeleteActivity = (activity: ActivityType) => {
    setDeleteDialog({ open: true, activity })
  }

  const handleConfirmDelete = async (activityId: number) => {
    try {
      const result = await removeActivity(activityId)
      if (result.success) {
        toast({ title: "Éxito", description: result.message, variant: "default" })
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Ocurrió un error al eliminar la actividad", variant: "destructive" })
    } finally {
      setDeleteDialog({ open: false, activity: null })
    }
  }

  const handleEnrollActivity = async (activity: ActivityType) => {
    if (activity.status === ActivityStatus.COMPLETED || activity.status === ActivityStatus.CANCELLED) {
      toast({
        title: "No disponible",
        description: `No puedes inscribirte en una actividad ${activity.status === ActivityStatus.COMPLETED ? 'finalizada' : 'cancelada'}.`,
        variant: "destructive",
      })
      return
    }

    if (user?.role === UserRole.CLIENT) {
      try {
        const paymentStatus = canUserEnrollBasedOnPaymentStatus(user)
        if (!paymentStatus.canEnroll) {
          toast({ title: "Acceso restringido", description: paymentStatus.reason, variant: "destructive" })
          return
        }
        if (paymentStatus.reason) {
          toast({ title: "Información", description: paymentStatus.reason, variant: "default" })
        }
      } catch {
        toast({ title: "Error", description: "No se pudo verificar el estado de tu membresía. Intenta nuevamente.", variant: "destructive" })
        return
      }

      if (!isUserEnrolled(activity, user.id)) {
        const userEnrollmentsForDay = getUserEnrollmentsForDay(activity.date, user.id)
        if (userEnrollmentsForDay >= maxActivitiesPerDay) {
          toast({
            title: "Límite alcanzado",
            description: `No puedes inscribirte a más de ${maxActivitiesPerDay} ${maxActivitiesPerDay === 1 ? 'actividad' : 'actividades'} por día.`,
            variant: "destructive",
          })
          return
        }
        if (!canEnrollBasedOnTime(activity)) {
          toast({
            title: "Tiempo insuficiente",
            description: `Las inscripciones abren ${registrationTime} horas antes.`,
            variant: "destructive",
          })
          return
        }
      } else {
        if (!canUnenrollBasedOnTime(activity)) {
          toast({
            title: "Tiempo insuficiente",
            description: `No puedes desinscribirte con menos de ${unregistrationTime} horas de anticipación.`,
            variant: "destructive",
          })
          return
        }
      }
    }

    setEnrollDialog({
      open: true,
      activity,
      isEnrolled: isUserEnrolled(activity, user?.id || -1),
    })
  }

  const handleConfirmEnroll = async (activity: ActivityType) => {
    if (!user) return
    try {
      if (enrollDialog.isEnrolled) {
        await unenrollFromActivity(activity.id, user.id)
      } else {
        await enrollInActivity(activity.id, user.id)
      }
    } catch (error) {
      console.error("Error al manejar inscripción:", error)
    }
    setEnrollDialog({ open: false, activity: null, isEnrolled: false })
  }

  const handleAttendanceActivity = (activity: ActivityType) => {
    setAttendanceDialog({ open: true, activity })
  }

  const handleDetailsClick = (activity: ActivityType) => {
    setDetailsDialog({ open: true, activity })
  }

  const handleClientPrimaryAction = (activity: ActivityType) => {
    if (canSubmitSummary(activity)) {
      router.push(`/activities/${activity.id}/summary`)
      return
    }
    handleEnrollActivity(activity)
  }

  return {
    // State
    user,
    loading,
    searchTerm,
    setSearchTerm,
    filterTrainer,
    setFilterTrainer,
    currentWeek,

    // Dialog states
    deleteDialog,
    setDeleteDialog,
    enrollDialog,
    setEnrollDialog,
    attendanceDialog,
    setAttendanceDialog,
    detailsDialog,
    setDetailsDialog,

    // Computed
    canManageActivities,
    isTrainer,
    trainerFullName,
    weekDates,
    dayNames,
    weekActivities,
    activitiesByDay,
    trainers,

    // Formatters
    formatTime,
    formatWeekRange,
    isToday,

    // Activity helpers
    getClientActionLabel,
    isClientActionDisabled,
    getClientActionVariant,
    canSubmitSummary,
    hasSubmittedSummary,

    // Handlers
    navigateWeek,
    goToToday,
    handleDeleteActivity,
    handleConfirmDelete,
    handleEnrollActivity,
    handleConfirmEnroll,
    handleAttendanceActivity,
    handleDetailsClick,
    handleClientPrimaryAction,

    // Router
    router,
  }
}
