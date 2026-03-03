"use client"

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
  const [attendanceQueueIds, setAttendanceQueueIds] = useState<number[]>([])
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
      setAttendanceQueueIds([])
    }
  }, [isOpen])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date))
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
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

  const canTakeAttendance = user?.role === UserRole.ADMIN
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
        return "Tarde"
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
        return "border-slate-300 bg-slate-100 text-slate-700"
      case AttendanceStatus.PENDING:
      default:
        return "border-yellow-200 bg-yellow-50 text-yellow-700"
    }
  }

  const updateAttendanceStatus = async (
    attendanceId: number,
    status: AttendanceStatus,
    options?: { removeFromQueue?: boolean; successMessage?: string },
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
      if (options?.removeFromQueue) {
        setAttendanceQueueIds((currentQueue) => currentQueue.filter((id) => id !== attendanceId))
      }

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

  const participantsNotPresent = selectedActivity?.participants.filter(
    (participant) => participant.status !== AttendanceStatus.PRESENT,
  ) ?? []

  const openTakeAttendanceDialog = () => {
    if (!canTakeAttendance) return

    const pendingAttendanceIds = participantsNotPresent.map((participant) => participant.id)
    setAttendanceQueueIds(pendingAttendanceIds)
    setIsTakeAttendanceOpen(true)
  }

  const participantsToProcess = selectedActivity?.participants.filter((participant) =>
    attendanceQueueIds.includes(participant.id),
  ) ?? []

  const presentParticipants = selectedActivity?.participants.filter((p) => p.status === AttendanceStatus.PRESENT) ?? []
  const absentParticipants = selectedActivity?.participants.filter((p) => p.status === AttendanceStatus.ABSENT) ?? []
  const occupancyRate = selectedActivity
    ? Math.round((selectedActivity.currentParticipants / selectedActivity.maxParticipants) * 100)
    : 0

  const toggleSummaryVisibility = (id: number) => {
    setVisibleSummaryAttendanceId((currentId) => currentId === id ? null : id)
  }

  return {
    activeTab,
    setActiveTab,
    visibleSummaryAttendanceId,
    toggleSummaryVisibility,
    isTakeAttendanceOpen,
    setIsTakeAttendanceOpen,
    attendanceQueueIds,
    setAttendanceQueueIds,
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
    participantsNotPresent,
    openTakeAttendanceDialog,
    participantsToProcess,
    presentParticipants,
    absentParticipants,
    occupancyRate,
  }
}
