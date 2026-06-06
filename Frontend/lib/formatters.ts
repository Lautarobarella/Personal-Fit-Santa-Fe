export const esYearFormatter = new Intl.DateTimeFormat("es-ES", {
  year: "numeric",
})

export const esMonthFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "long",
})

export const esMonthYearFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
})

export const esShortDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
})

export const esShortDateYearFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

export const esNumericDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

export const esArNumericDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

export const esTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
})

export const esNumericDateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export const esShortDateYearTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export const esShortDateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

export const esLongDateFormatter = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
})

export const esArDecimalFormatter = new Intl.NumberFormat("es-AR", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
