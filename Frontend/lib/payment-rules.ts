export function getNextPaymentDueDate(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 10, 0, 0, 0, 0)
}

export function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}
