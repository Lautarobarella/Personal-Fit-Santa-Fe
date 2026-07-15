import { ActivityStatus, AttendanceStatus, type UserActivityDetails } from "@/types"

const FINALIZED_ATTENDANCE_STATUSES = new Set([
  AttendanceStatus.PRESENT,
  AttendanceStatus.LATE,
  AttendanceStatus.ABSENT,
])

export function isFinalizedClientActivity(activity: UserActivityDetails) {
  return (
    activity.activityStatus === ActivityStatus.COMPLETED &&
    FINALIZED_ATTENDANCE_STATUSES.has(activity.clientStatus)
  )
}
