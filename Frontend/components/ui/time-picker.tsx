"use client"

import * as React from "react"
import { Clock, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value?: string
  onChange?: (time: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  step?: number // Intervalo en minutos (15, 30, 60)
  selectedDate?: string // Nueva prop para validar horas pasadas
  disablePastTimes?: boolean // Nueva prop para deshabilitar horas pasadas
}

export function TimePicker({ 
  value, 
  onChange, 
  placeholder = "--:--", 
  className,
  disabled = false,
  step = 15,
  selectedDate,
  disablePastTimes = false
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedTime, setSelectedTime] = React.useState<string>(value || "")
  const [selectedHour, setSelectedHour] = React.useState<number>(0)
  const [selectedMinute, setSelectedMinute] = React.useState<number>(0)

  const timePickerRef = React.useRef<HTMLDivElement>(null)

  // Cerrar el timepicker cuando se hace clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Actualizar tiempo seleccionado cuando cambia el value
  React.useEffect(() => {
    if (value) {
      setSelectedTime(value)
      const [hours, minutes] = value.split(':').map(Number)
      setSelectedHour(hours)
      setSelectedMinute(minutes)
    }
  }, [value])

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  const handleTimeSelect = (hour: number, minute: number) => {
    // Validar si la hora ya pasó (solo para hoy)
    if (selectedDate && isTimeInPast(hour, minute, selectedDate)) {
      return // No hacer nada si la hora ya pasó
    }
    
    const timeString = formatTime(hour, minute)
    setSelectedTime(timeString)
    setSelectedHour(hour)
    setSelectedMinute(minute)
    onChange?.(timeString)
    setIsOpen(false)
  }

  // Función para verificar si una hora ya pasó
  const isTimeInPast = (hour: number, minute: number, date: string): boolean => {
    if (!date || !disablePastTimes) return false
    
    const today = new Date()
    const selectedDateObj = new Date(date)
    
    // Solo validar si es el día de hoy
    if (selectedDateObj.toDateString() !== today.toDateString()) {
      return false
    }
    
    const currentHour = today.getHours()
    const currentMinute = today.getMinutes()
    
    return hour < currentHour || (hour === currentHour && minute <= currentMinute)
  }

  const incrementHour = () => {
    const newHour = (selectedHour + 1) % 24
    setSelectedHour(newHour)
  }

  const decrementHour = () => {
    const newHour = selectedHour === 0 ? 23 : selectedHour - 1
    setSelectedHour(newHour)
  }

  const incrementMinute = () => {
    const newMinute = (selectedMinute + step) % 60
    setSelectedMinute(newMinute)
  }

  const decrementMinute = () => {
    const newMinute = selectedMinute === 0 ? 60 - step : selectedMinute - step
    setSelectedMinute(newMinute)
  }

  const setCurrentTime = () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = Math.floor(now.getMinutes() / step) * step
    handleTimeSelect(hours, minutes)
  }

  const clearTime = () => {
    setSelectedTime("")
    setSelectedHour(0)
    setSelectedMinute(0)
    onChange?.("")
    setIsOpen(false)
  }

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += step) {
        options.push({ hour, minute })
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  return (
    <div className={cn("relative", className)} ref={timePickerRef}>
      <div className="flex gap-2">
        <Input
          type="text"
          value={selectedTime}
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
          <Clock className="h-4 w-4" />
        </Button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-professional-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Seleccionar Hora</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={setCurrentTime}
                className="text-primary hover:text-primary/90"
              >
                Ahora
              </Button>
            </div>
          </div>

          {/* Selector de hora y minuto */}
          <div className="p-4">
            <div className="flex items-center justify-center gap-4 mb-4">
              {/* Hora */}
              <div className="flex flex-col items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={incrementHour}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="text-2xl font-bold text-foreground py-2 min-w-[3rem] text-center">
                  {selectedHour.toString().padStart(2, '0')}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={decrementHour}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-2xl font-bold text-foreground">:</div>

              {/* Minuto */}
              <div className="flex flex-col items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={incrementMinute}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="text-2xl font-bold text-foreground py-2 min-w-[3rem] text-center">
                  {selectedMinute.toString().padStart(2, '0')}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={decrementMinute}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Botón de confirmar */}
            <Button
              type="button"
              onClick={() => handleTimeSelect(selectedHour, selectedMinute)}
              disabled={isTimeInPast(selectedHour, selectedMinute, selectedDate || "")}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar
            </Button>
          </div>

          {/* Opciones rápidas de tiempo */}
          <div className="p-4 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Horarios Comunes</h4>
            <div className="grid grid-cols-4 gap-2">
              {[
                { hour: 9, minute: 0, label: "9:00" },
                { hour: 12, minute: 0, label: "12:00" },
                { hour: 15, minute: 0, label: "15:00" },
                { hour: 18, minute: 0, label: "18:00" },
                { hour: 19, minute: 0, label: "19:00" },
                { hour: 20, minute: 0, label: "20:00" },
                { hour: 21, minute: 0, label: "21:00" },
                { hour: 22, minute: 0, label: "22:00" }
              ].map(({ hour, minute, label }) => {
                const isPast = isTimeInPast(hour, minute, selectedDate || "")
                return (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTimeSelect(hour, minute)}
                    disabled={isPast}
                    className={cn(
                      "text-xs hover:bg-accent",
                      isPast && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearTime}
              className="text-muted-foreground hover:text-foreground"
            >
              Borrar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
