"use client"

import * as React from "react"
import { Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  disablePastDates?: boolean // Nueva prop para controlar validación de fechas pasadas
}

export function DatePicker({ 
  value, 
  onChange, 
  placeholder = "dd/mm/aaaa", 
  className,
  disabled = false,
  disablePastDates = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(
    value ? new Date(value) : null
  )

  const datePickerRef = React.useRef<HTMLDivElement>(null)

  // Cerrar el datepicker cuando se hace clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Actualizar fecha seleccionada cuando cambia el value
  React.useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value))
    }
  }, [value])

  const formatDate = (date: Date | null) => {
    if (!date) return ""
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    
    // Verificar si está deshabilitada la selección de fechas pasadas
    if (disablePastDates) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      newDate.setHours(0, 0, 0, 0)
      
      if (newDate < today) {
        return // No permitir seleccionar fechas pasadas
      }
    }
    
    setSelectedDate(newDate)
    onChange?.(newDate.toISOString().split('T')[0])
    setIsOpen(false)
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
    onChange?.(today.toISOString().split('T')[0])
    setIsOpen(false)
  }

  const clearDate = () => {
    setSelectedDate(null)
    onChange?.("")
    setIsOpen(false)
  }

  const isPastDate = (day: number) => {
    if (!disablePastDates) return false
    
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dateToCheck.setHours(0, 0, 0, 0)
    
    return dateToCheck < today
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    // Ajustar para que la semana empiece en lunes (0 = lunes, 6 = domingo)
    const adjustedStartingDay = startingDay === 0 ? 6 : startingDay - 1
    
    return { daysInMonth, startingDay: adjustedStartingDay }
  }

  const getDaysArray = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentDate)
    const days = []
    
    // Días del mes anterior
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false })
    }
    
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true })
    }
    
    // Días del mes siguiente
    const remainingDays = 42 - days.length // 6 semanas * 7 días
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false })
    }
    
    return days
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear()
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return day === selectedDate.getDate() && 
           currentDate.getMonth() === selectedDate.getMonth() && 
           currentDate.getFullYear() === selectedDate.getFullYear()
  }

  const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ]

  return (
    <div className={cn("relative", className)} ref={datePickerRef}>
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
        <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-professional-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">
              {monthNames[currentDate.getMonth()]} de {currentDate.getFullYear()}
            </h3>
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextMonth}
                className="h-6 w-6 p-0 hover:bg-accent"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-6 w-6 p-0 hover:bg-accent"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 p-4 pb-2">
            {["LU", "MA", "MI", "JU", "VI", "SA", "DO"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendario */}
          <div className="grid grid-cols-7 gap-1 px-4 pb-4">
            {getDaysArray().map(({ day, isCurrentMonth }, index) => {
              const isDisabled = !isCurrentMonth || isPastDate(day)
              
              return (
                <button
                  key={index}
                  onClick={() => !isDisabled && handleDateSelect(day)}
                  disabled={isDisabled}
                  className={cn(
                    "h-8 w-8 rounded-md text-sm font-medium transition-colors",
                    (!isCurrentMonth || isPastDate(day)) && "text-muted-foreground/50 cursor-default",
                    isCurrentMonth && !isPastDate(day) && "hover:bg-accent cursor-pointer",
                    isToday(day) && !isPastDate(day) && "bg-accent text-accent-foreground",
                    isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDate}
              className="text-muted-foreground hover:text-foreground"
            >
              Borrar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-primary hover:text-primary/90"
            >
              Hoy
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
