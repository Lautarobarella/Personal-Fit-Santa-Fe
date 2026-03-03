"use client"

import { useAttendance } from "@/hooks/attendance/use-attendance"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-provider"
import { AttendanceStatus } from "@/lib/types"
import { useEffect, useState } from "react"

export function useAttendanceActivityDialog(
  activityId: number,
  open: boolean,
  onOpenChange: (open: boolean) => void,
) {
  const { user } = useAuth()
  const [isAttending, setIsAttending] = useState(false)
  const { toast } = useToast()
  const {
    activityAttendances,
    isLoading,
    error,
    loadActivityAttendances,
    markAttendance,
    getAttendanceStats,
  } = useAttendance()

  useEffect(() => {
    if (open && activityId) {
      loadActivityAttendances(activityId)
    }
  }, [activityId, open, loadActivityAttendances])

  const formatDateTime = (date: Date | string) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const stats = getAttendanceStats()

  const handleMarkStatus = async (attendanceId: number, status: AttendanceStatus) => {
    setIsAttending(true)

    const statusLabels: Record<string, { title: string; errorDesc: string }> = {
      [AttendanceStatus.PRESENT]: { title: "Asistencia marcada", errorDesc: "al marcar la asistencia" },
      [AttendanceStatus.ABSENT]: { title: "Ausencia marcada", errorDesc: "al marcar la ausencia" },
      [AttendanceStatus.LATE]: { title: "Tardanza marcada", errorDesc: "al marcar la tardanza" },
    }

    const label = statusLabels[status] || { title: "Estado actualizado", errorDesc: "al actualizar el estado" }

    try {
      const result = await markAttendance(attendanceId, status)

      if (result.success) {
        toast({
          title: label.title,
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
        description: `Ocurrió un error ${label.errorDesc}`,
        variant: "destructive",
      })
    } finally {
      setIsAttending(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return {
    activityAttendances,
    isLoading,
    error,
    isAttending,
    stats,
    formatDateTime,
    handleMarkStatus,
    handleClose,
  }
}
