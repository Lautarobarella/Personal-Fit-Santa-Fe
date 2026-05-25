export function getActivityToday(): Date {
  return new Date()
}

export function getStartOfWeek(date: Date): Date {
  const weekStart = new Date(date)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

export function getInitialActivitiesWeekStart(date = getActivityToday()): Date {
  return getStartOfWeek(date)
}
