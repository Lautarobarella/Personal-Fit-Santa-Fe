import { getInitialActivitiesWeekStart, getStartOfWeek } from "@/lib/activity-week"

describe("activity week helpers", () => {
  it("returns the same week's Sunday from Sunday to Saturday", () => {
    const sunday = getInitialActivitiesWeekStart(new Date(2026, 4, 24, 15, 30))
    const saturday = getInitialActivitiesWeekStart(new Date(2026, 4, 30, 15, 30))

    expect(sunday).toEqual(new Date(2026, 4, 24, 0, 0, 0, 0))
    expect(saturday).toEqual(new Date(2026, 4, 24, 0, 0, 0, 0))
  })

  it("keeps generic week calculations anchored to the date's own Sunday", () => {
    const monday = getStartOfWeek(new Date(2026, 4, 25, 15, 30))

    expect(monday).toEqual(new Date(2026, 4, 24, 0, 0, 0, 0))
  })
})
