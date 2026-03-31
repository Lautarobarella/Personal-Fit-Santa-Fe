const PAYMENT_CREATION_WINDOW_START_DAY = 1
const PAYMENT_CREATION_WINDOW_END_DAY = 10

export function isWithinPaymentCreationWindow(date: Date = new Date()): boolean {
  const day = date.getDate()
  return day >= PAYMENT_CREATION_WINDOW_START_DAY && day <= PAYMENT_CREATION_WINDOW_END_DAY
}

export function getNextPaymentDueDate(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 10, 0, 0, 0, 0)
}

export function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getPaymentCreationWindowLabel(): string {
  return `del ${PAYMENT_CREATION_WINDOW_START_DAY} al ${PAYMENT_CREATION_WINDOW_END_DAY} de cada mes`
}
