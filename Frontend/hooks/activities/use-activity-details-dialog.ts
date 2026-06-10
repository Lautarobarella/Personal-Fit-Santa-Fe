"use client"

import { esLongDateFormatter, esNumericDateTimeFormatter, esTimeFormatter } from "@/lib/formatters"
import { useActivityContext } from "@/contexts/activity-provider"
import { useAuth } from "@/contexts/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { ActivityStatus, AttendanceStatus, UserRole } from "@/lib/types"
import { useEffect, useState } from "react"

export function useActivityDetailsDialog(
  activityId: number,
  isOpen: boolean,
) {
  const [activeTab, setActiveTab] = useState("overview")
  const [visibleSummaryAttendanceId, setVisibleSummaryAttendanceId] = useState<number | null>(null)
  const [isTakeAttendanceOpen, setIsTakeAttendanceOpen] = useState(false)
  const [updatingAttendanceId, setUpdatingAttendanceId] = useState<number | null>(null)

  const { user } = useAuth()
  const { toast } = useToast()
  const {
    selectedActivity,
    loadActivityDetail,
    markParticipantAttendance,
  } = useActivityContext()

  useEffect(() => {
    loadActivityDetail(activityId)
  }, [activityId, loadActivityDetail])

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("overview")
      setVisibleSummaryAttendanceId(null)
      setIsTakeAttendanceOpen(false)
      setUpdatingAttendanceId(null)
    }
  }, [isOpen])

  const formatDate = (date: Date) => {
    return esLongDateFormatter.format(new Date(date))
  }

  const formatTime = (date: Date) => {
    return esTimeFormatter.format(new Date(date))
  }

  const formatDateTime = (date: Date) => {
    return esNumericDateTimeFormatter.format(new Date(date))
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case ActivityStatus.ACTIVE:
        return "Activa"
      case ActivityStatus.CANCELLED:
        return "Cancelada"
      case ActivityStatus.COMPLETED:
        return "Completada"
      default:
        return status
    }
  }

  const canTakeAttendance = user?.role === UserRole.ADMIN || user?.role === UserRole.TRAINER

  const attendanceStatusOptions: AttendanceStatus[] = [
    AttendanceStatus.PRESENT,
    AttendanceStatus.ABSENT,
    AttendanceStatus.LATE,
    AttendanceStatus.PENDING,
  ]

  const getAttendanceStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return "Presente"
      case AttendanceStatus.ABSENT:
        return "Ausente"
      case AttendanceStatus.LATE:
        return "Tardanza"
      case AttendanceStatus.PENDING:
      default:
        return "Pendiente"
    }
  }

  const getAttendanceStatusSelectClass = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return "border-green-200 bg-green-50 text-green-700"
      case AttendanceStatus.ABSENT:
        return "border-red-200 bg-red-50 text-red-700"
      case AttendanceStatus.LATE:
        return "border-yellow-200 bg-yellow-50 text-yellow-700"
      case AttendanceStatus.PENDING:
      default:
        return "border-yellow-200 bg-yellow-50 text-yellow-700"
    }
  }

  const updateAttendanceStatus = async (
    attendanceId: number,
    status: AttendanceStatus,
    options?: { successMessage?: string },
  ) => {
    if (!canTakeAttendance) return

    setUpdatingAttendanceId(attendanceId)
    try {
      const result = await markParticipantAttendance(attendanceId, status)

      if (!result.success) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
        return
      }

      await loadActivityDetail(activityId)
      toast({
        title: "Asistencia actualizada",
        description: options?.successMessage || "El estado de asistencia fue actualizado.",
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar la asistencia.",
        variant: "destructive",
      })
    } finally {
      setUpdatingAttendanceId(null)
    }
  }

  const openTakeAttendanceDialog = () => {
    if (!canTakeAttendance) return
    setIsTakeAttendanceOpen(true)
  }

  // Disjoint buckets: a LATE participant attended (counts toward "Asistieron")
  // but is NOT a "Presente" — otherwise the same person shows up in two badges.
  const presentParticipants =
    selectedActivity?.participants.filter((p) => p.status === AttendanceStatus.PRESENT) ?? []
  const lateParticipants = selectedActivity?.participants.filter((p) => p.status === AttendanceStatus.LATE) ?? []
  const absentParticipants = selectedActivity?.participants.filter((p) => p.status === AttendanceStatus.ABSENT) ?? []
  const attendedParticipants = [...presentParticipants, ...lateParticipants]
  const occupancyRate = selectedActivity
    ? Math.round((selectedActivity.currentParticipants / selectedActivity.maxParticipants) * 100)
    : 0

  const toggleSummaryVisibility = (id: number) => {
    setVisibleSummaryAttendanceId((currentId) => (currentId === id ? null : id))
  }

  return {
    activeTab,
    setActiveTab,
    visibleSummaryAttendanceId,
    toggleSummaryVisibility,
    isTakeAttendanceOpen,
    setIsTakeAttendanceOpen,
    updatingAttendanceId,
    selectedActivity,
    formatDate,
    formatTime,
    formatDateTime,
    getStatusText,
    canTakeAttendance,
    attendanceStatusOptions,
    getAttendanceStatusLabel,
    getAttendanceStatusSelectClass,
    updateAttendanceStatus,
    openTakeAttendanceDialog,
    presentParticipants,
    lateParticipants,
    absentParticipants,
    attendedParticipants,
    occupancyRate,
    reloadActivityDetail: () => loadActivityDetail(activityId),
  }
}
