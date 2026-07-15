import { isFinalizedClientActivity } from "@/lib/activity-progress"
import { ActivityStatus, AttendanceStatus, type UserActivityDetails } from "@/types"

const buildActivity = (
  activityStatus: ActivityStatus,
  clientStatus: AttendanceStatus,
): UserActivityDetails => ({
  id: 1,
  name: "Funcional",
  trainerName: "Entrenador",
  date: "2026-07-14T18:00:00",
  activityStatus,
  clientStatus,
  summary: null,
})

describe("isFinalizedClientActivity", () => {
  it.each([
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.ABSENT,
  ])("incluye una clase finalizada con asistencia %s", (attendanceStatus) => {
    expect(
      isFinalizedClientActivity(buildActivity(ActivityStatus.COMPLETED, attendanceStatus)),
    ).toBe(true)
  })

  it("excluye asistencias pendientes aunque la clase figure finalizada", () => {
    expect(
      isFinalizedClientActivity(
        buildActivity(ActivityStatus.COMPLETED, AttendanceStatus.PENDING),
      ),
    ).toBe(false)
  })

  it.each([ActivityStatus.ACTIVE, ActivityStatus.CANCELLED])(
    "excluye una clase %s aunque la asistencia esté resuelta",
    (activityStatus) => {
      expect(
        isFinalizedClientActivity(buildActivity(activityStatus, AttendanceStatus.ABSENT)),
      ).toBe(false)
    },
  )
})
