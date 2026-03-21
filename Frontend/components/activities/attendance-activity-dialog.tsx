"use client"

import { TakeAttendanceDialog } from "@/components/activities/take-attendance-dialog"

interface AttendanceActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activityId: number
  onAttendance?: () => void
}

export function AttendanceActivityDialog({
  open,
  onOpenChange,
  activityId,
  onAttendance,
}: AttendanceActivityDialogProps) {
  return (
    <TakeAttendanceDialog
      open={open}
      onOpenChange={onOpenChange}
      activityId={activityId}
      onAttendanceUpdated={onAttendance}
    />
  )
}
