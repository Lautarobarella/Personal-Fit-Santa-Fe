"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useToast } from "@/hooks/use-toast"
import { fetchTrainerActivitiesByDate } from "@/api/activities/activitiesApi"
import { fetchActivityAttendancesWithUserInfo, updateAttendanceStatus } from "@/api/attendance/attendanceApi"
import { UserRole, AttendanceStatus } from "@/types"
import type { TrainerActivityType, AttendanceType } from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function useAttendancePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  useRequireAuth()

  const [activities, setActivities] = useState<TrainerActivityType[]>([])
  const [selectedActivityId, setSelectedActivityId] = useState<string>("")
  const [participants, setParticipants] = useState<AttendanceType[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [updating, setUpdating] = useState<number | null>(null)

  const todayFormatted = format(new Date(), "d 'de' MMMM", { locale: es })

  // Fetch activities for today
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user || user.role !== UserRole.TRAINER) return

      try {
        setLoadingActivities(true)
        const dateStr = format(new Date(), 'yyyy-MM-dd')
        const data = await fetchTrainerActivitiesByDate(user.id, dateStr)
        setActivities(data)
      } catch {
        toast({
          title: "Error",
          description: "No se pudieron cargar las clases asignadas.",
          variant: "destructive",
        })
      } finally {
        setLoadingActivities(false)
      }
    }

    fetchActivities()
  }, [user, toast])

  // Fetch participants when activity is selected
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!selectedActivityId) return

      try {
        setLoadingParticipants(true)
        const data = await fetchActivityAttendancesWithUserInfo(Number(selectedActivityId))
        setParticipants(data)
      } catch {
        toast({
          title: "Error",
          description: "No se pudo cargar la lista de alumnos.",
          variant: "destructive",
        })
      } finally {
        setLoadingParticipants(false)
      }
    }

    fetchParticipants()
  }, [selectedActivityId, toast])

  const handleStatusUpdate = async (attendanceId: number, newStatus: AttendanceStatus) => {
    try {
      setUpdating(attendanceId)
      await updateAttendanceStatus(attendanceId, newStatus)

      // Optimistic update
      setParticipants(prev => prev.map(p =>
        p.id === attendanceId ? { ...p, status: newStatus } : p
      ))
      toast({
        title: "Asistencia actualizada",
        description: `Estado cambiado a ${newStatus === AttendanceStatus.PRESENT ? 'Presente' : 'Ausente'}`,
        variant: "default",
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar la asistencia.",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  return {
    user,
    activities,
    selectedActivityId,
    setSelectedActivityId,
    participants,
    loadingActivities,
    loadingParticipants,
    updating,
    todayFormatted,
    handleStatusUpdate,
  }
}
