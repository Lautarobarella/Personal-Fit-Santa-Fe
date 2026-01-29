"use client"

import * as React from "react"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DatePickerScrollProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePickerScroll({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  className,
  disabled = false
}: DatePickerScrollProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(
    value ? new Date(value + 'T00:00:00') : null
  )
  const [tempMonth, setTempMonth] = React.useState(selectedDate?.getMonth() || new Date().getMonth())
  const [tempDay, setTempDay] = React.useState(selectedDate?.getDate() || new Date().getDate())
  const [tempYear, setTempYear] = React.useState(selectedDate?.getFullYear() || new Date().getFullYear())

  const datePickerRef = React.useRef<HTMLDivElement>(null)
  const dayScrollRef = React.useRef<HTMLDivElement>(null)
  const monthScrollRef = React.useRef<HTMLDivElement>(null)
  const yearScrollRef = React.useRef<HTMLDivElement>(null)

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
      const date = new Date(value + 'T00:00:00')
      setSelectedDate(date)
      setTempMonth(date.getMonth())
      setTempDay(date.getDate())
      setTempYear(date.getFullYear())
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

  const formatDateToString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  // Generar arrays para los selectores
  const months = monthNames.map((name, index) => ({ value: index, label: name }))
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1900 + 2 }, (_, i) => ({
    value: currentYear + 1 - i,
    label: (currentYear + 1 - i).toString()
  }))

  // Calcular días del mes seleccionado
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const daysInMonth = getDaysInMonth(tempMonth, tempYear)
  const days = Array.from({ length: daysInMonth }, (_, i) => ({
    value: i + 1,
    label: (i + 1).toString()
  }))

  // Ajustar el día si es mayor al máximo del mes
  React.useEffect(() => {
    const maxDays = getDaysInMonth(tempMonth, tempYear)
    if (tempDay > maxDays) {
      setTempDay(maxDays)
    }
  }, [tempMonth, tempYear, tempDay])

  // Función helper para obtener el valor del centro de un scroll
  const getCenterValueFromScroll = (containerRef: React.RefObject<HTMLDivElement | null>, items: { value: number; label: string }[]) => {
    if (!containerRef.current) return items[0]?.value || 0

    const container = containerRef.current
    const scrollTop = container.scrollTop
    const itemHeight = 40
    const paddingTop = 80 // py-20 = 20 * 4 = 80px
    const containerHeight = container.clientHeight

    // Usar exactamente el mismo cálculo que el resaltado
    const centerPosition = scrollTop + containerHeight / 2
    const rawIndex = (centerPosition - paddingTop) / itemHeight
    const centerIndex = Math.round(rawIndex) - 1  // -1 para bajar una posición
    const clampedIndex = Math.max(0, Math.min(items.length - 1, centerIndex))



    return items[clampedIndex]?.value || items[0]?.value || 0
  }

  const handleConfirm = () => {
    // Obtener los valores del centro de cada scroll
    const centerDay = getCenterValueFromScroll(dayScrollRef, days)

    const centerMonth = getCenterValueFromScroll(monthScrollRef, months)

    const centerYear = getCenterValueFromScroll(yearScrollRef, years)

    const newDate = new Date(centerYear, centerMonth, centerDay)

    setSelectedDate(newDate)
    onChange?.(formatDateToString(newDate))
    setIsOpen(false)
  }

  const handleCancel = () => {
    // Restaurar valores originales
    if (selectedDate) {
      setTempMonth(selectedDate.getMonth())
      setTempDay(selectedDate.getDate())
      setTempYear(selectedDate.getFullYear())
    } else {
      const today = new Date()
      setTempMonth(today.getMonth())
      setTempDay(today.getDate())
      setTempYear(today.getFullYear())
    }
    setIsOpen(false)
  }

  const ScrollSelector = ({
    items,
    value,
    onChange,
    className: selectorClassName,
    scrollRef
  }: {
    items: { value: number; label: string }[]
    value: number
    onChange: (value: number) => void
    className?: string
    scrollRef?: React.RefObject<HTMLDivElement | null>
  }) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [centerValue, setCenterValue] = React.useState(value)
    const itemHeight = 40

    // Asignar la ref externa si se proporciona
    React.useEffect(() => {
      if (scrollRef && containerRef.current) {
        (scrollRef as any).current = containerRef.current
      }
    }, [scrollRef])

    React.useEffect(() => {
      if (containerRef.current) {
        const selectedIndex = items.findIndex(item => item.value === value)
        if (selectedIndex !== -1) {
          containerRef.current.scrollTo({
            top: selectedIndex * itemHeight - itemHeight * 2,
            behavior: 'smooth'
          })
        }
      }
    }, [value, items])

    // Calcular el valor del centro cuando se hace scroll
    React.useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const updateCenterValue = () => {
        const scrollTop = container.scrollTop
        const containerHeight = container.clientHeight
        const centerPosition = scrollTop + containerHeight / 2
        const paddingTop = 80

        const rawIndex = (centerPosition - paddingTop) / itemHeight
        const centerIndex = Math.round(rawIndex) - 1  // -1 para bajar una posición
        const clampedIndex = Math.max(0, Math.min(items.length - 1, centerIndex))

        setCenterValue(items[clampedIndex]?.value || value)
      }

      const handleScroll = () => {
        updateCenterValue()
      }

      container.addEventListener('scroll', handleScroll, { passive: true })
      updateCenterValue() // Calcular valor inicial

      return () => container.removeEventListener('scroll', handleScroll)
    }, [items, value])

    return (
      <div className={cn("relative", selectorClassName)}>
        <div
          ref={containerRef}
          className="h-48 overflow-y-scroll overflow-x-hidden scrollbar-hide"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          <div className="py-20">
            {items.map((item) => (
              <div
                key={item.value}
                className={cn(
                  "h-10 flex items-center justify-center transition-all duration-200",
                  "text-base font-medium select-none",
                  item.value === centerValue
                    ? "text-orange-500 font-bold scale-110"
                    : "text-muted-foreground"
                )}
                style={{ scrollSnapAlign: 'center' }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
        {/* Líneas de selección */}
        <div className="absolute inset-0 pointer-events-none flex items-center">
          <div className="w-full h-10 border-t border-b border-border bg-accent/20"></div>
        </div>
      </div>
    )
  }

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
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/50 z-40" onClick={handleCancel} />

          {/* Modal */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-card border border-border rounded-2xl shadow-professional-lg z-50 max-w-sm mx-auto">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-center text-foreground">
                Seleccionar Fecha
              </h3>
            </div>

            {/* Selectores */}
            <div className="grid grid-cols-3 gap-2 p-4">
              {/* Día */}
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-2">Día</div>
                <ScrollSelector
                  items={days}
                  value={tempDay}
                  onChange={setTempDay}
                  scrollRef={dayScrollRef}
                />
              </div>

              {/* Mes */}
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-2">Mes</div>
                <ScrollSelector
                  items={months}
                  value={tempMonth}
                  onChange={setTempMonth}
                  scrollRef={monthScrollRef}
                />
              </div>

              {/* Año */}
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-2">Año</div>
                <ScrollSelector
                  items={years}
                  value={tempYear}
                  onChange={setTempYear}
                  scrollRef={yearScrollRef}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                className="flex-1 text-muted-foreground hover:text-foreground"
              >
                CANCELAR
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                ACEPTAR
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
