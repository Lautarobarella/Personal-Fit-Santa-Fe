"use client"

import * as React from "react"
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DatePickerBirthdateProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

/**
 * DatePickerBirthdate
 *
 * A calendar-style date picker optimized for selecting birth dates.
 * Features quick year and month selectors so users can navigate
 * decades instantly instead of clicking month-by-month.
 */
export function DatePickerBirthdate({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  className,
  disabled = false,
}: DatePickerBirthdateProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentDate, setCurrentDate] = React.useState(() => {
    if (value) return new Date(value + "T00:00:00")
    // Default view: ~25 years ago for birth date convenience
    const d = new Date()
    d.setFullYear(d.getFullYear() - 25)
    return d
  })
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(
    value ? new Date(value + "T00:00:00") : null
  )

  // Controls whether the year/month selector grid is visible
  const [showYearSelector, setShowYearSelector] = React.useState(false)
  // The decade base shown in the year grid (shows 12 years at a time)
  const [decadeBase, setDecadeBase] = React.useState(() => {
    const yr = value ? new Date(value + "T00:00:00").getFullYear() : new Date().getFullYear() - 25
    return Math.floor(yr / 12) * 12
  })
  // Step inside selector: "year" first, then "month"
  const [selectorStep, setSelectorStep] = React.useState<"year" | "month">("year")
  // Temporarily chosen year before picking month
  const [pendingYear, setPendingYear] = React.useState(currentDate.getFullYear())

  const datePickerRef = React.useRef<HTMLDivElement>(null)
  const yearGridRef = React.useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowYearSelector(false)
        setSelectorStep("year")
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  // Sync from external value
  React.useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00")
      setSelectedDate(d)
      setCurrentDate(d)
      setDecadeBase(Math.floor(d.getFullYear() / 12) * 12)
      setPendingYear(d.getFullYear())
    }
  }, [value])

  const formatDate = (date: Date | null) => {
    if (!date) return ""
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatDateToString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(newDate)
    onChange?.(formatDateToString(newDate))
    setIsOpen(false)
    setShowYearSelector(false)
    setSelectorStep("year")
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const clearDate = () => {
    setSelectedDate(null)
    onChange?.("")
    setIsOpen(false)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    const adjustedStartingDay = startingDay === 0 ? 6 : startingDay - 1
    return { daysInMonth, startingDay: adjustedStartingDay }
  }

  const getDaysArray = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentDate)
    const days: { day: number; isCurrentMonth: boolean }[] = []

    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false })
    }

    return days
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    )
  }

  const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ]

  const monthNamesShort = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ]

  const currentYear = new Date().getFullYear()

  // Open the year/month selector
  const openYearSelector = () => {
    setDecadeBase(Math.floor(currentDate.getFullYear() / 12) * 12)
    setPendingYear(currentDate.getFullYear())
    setSelectorStep("year")
    setShowYearSelector(true)
  }

  // Select a year → move to month step
  const handleYearPick = (year: number) => {
    setPendingYear(year)
    setSelectorStep("month")
  }

  // Select a month → apply and go back to calendar
  const handleMonthPick = (month: number) => {
    setCurrentDate(new Date(pendingYear, month, 1))
    setShowYearSelector(false)
    setSelectorStep("year")
  }

  return (
    <div className={cn("relative", className)} ref={datePickerRef}>
      {/* Trigger */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={formatDate(selectedDate)}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          className="flex-1 cursor-pointer"
          onClick={() => !disabled && setIsOpen(!isOpen)}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-professional-lg z-50 overflow-hidden">
          {showYearSelector ? (
            /* -------- Year / Month selector -------- */
            <div className="p-4">
              {selectorStep === "year" ? (
                <>
                  {/* Decade navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setDecadeBase((prev) => prev - 12)}
                      className="h-8 w-8 p-0 hover:bg-accent"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-sm text-foreground">
                      {decadeBase} – {decadeBase + 11}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setDecadeBase((prev) => prev + 12)}
                      disabled={decadeBase + 12 > currentYear}
                      className="h-8 w-8 p-0 hover:bg-accent"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Year grid */}
                  <div ref={yearGridRef} className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }, (_, i) => {
                      const year = decadeBase + i
                      if (year > currentYear) return null
                      const isCurrentYear = year === currentDate.getFullYear()
                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => handleYearPick(year)}
                          className={cn(
                            "py-2.5 rounded-lg text-sm font-medium transition-colors",
                            isCurrentYear
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent text-foreground"
                          )}
                        >
                          {year}
                        </button>
                      )
                    })}
                  </div>

                  {/* Cancel */}
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setShowYearSelector(false)
                        setSelectorStep("year")
                      }}
                      className="text-muted-foreground text-xs"
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                /* -------- Month grid (after picking year) -------- */
                <>
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setSelectorStep("year")}
                      className="h-8 px-2 hover:bg-accent flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="text-sm">Año</span>
                    </Button>
                    <span className="font-semibold text-sm text-foreground">
                      {pendingYear}
                    </span>
                    <div className="w-16" /> {/* Spacer for alignment */}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {monthNamesShort.map((name, idx) => {
                      const isCurrentMonth =
                        idx === currentDate.getMonth() &&
                        pendingYear === currentDate.getFullYear()
                      // Don't allow future months in the current year
                      const isFuture =
                        pendingYear === currentYear && idx > new Date().getMonth()
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isFuture}
                          onClick={() => handleMonthPick(idx)}
                          className={cn(
                            "py-2.5 rounded-lg text-sm font-medium transition-colors",
                            isFuture && "text-muted-foreground/40 cursor-default",
                            isCurrentMonth
                              ? "bg-primary text-primary-foreground"
                              : !isFuture && "hover:bg-accent text-foreground"
                          )}
                        >
                          {name}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setShowYearSelector(false)
                        setSelectorStep("year")
                      }}
                      className="text-muted-foreground text-xs"
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* -------- Calendar view -------- */
            <>
              {/* Header with clickable month/year for fast navigation */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={goToPreviousMonth}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Clickable label to open year/month selector */}
                <button
                  type="button"
                  onClick={openYearSelector}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <span className="font-semibold text-sm text-foreground capitalize">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={goToNextMonth}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 gap-1 p-4 pb-2">
                {["LU", "MA", "MI", "JU", "VI", "SA", "DO"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-1 px-4 pb-4">
                {getDaysArray().map(({ day, isCurrentMonth }, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => isCurrentMonth && handleDateSelect(day)}
                    disabled={!isCurrentMonth}
                    className={cn(
                      "h-8 w-8 rounded-md text-sm font-medium transition-colors",
                      !isCurrentMonth && "text-muted-foreground/30 cursor-default",
                      isCurrentMonth && "hover:bg-accent cursor-pointer",
                      isToday(day) && isCurrentMonth && "bg-accent text-accent-foreground",
                      isSelected(day) && isCurrentMonth && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={clearDate}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Borrar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    const today = new Date()
                    setCurrentDate(today)
                    setSelectedDate(today)
                    onChange?.(formatDateToString(today))
                    setIsOpen(false)
                  }}
                  className="text-primary hover:text-primary/90"
                >
                  Hoy
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
