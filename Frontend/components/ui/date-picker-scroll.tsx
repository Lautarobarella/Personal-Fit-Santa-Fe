"use client"

import * as React from "react"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Props for the DatePickerScroll component.
 * @interface DatePickerScrollProps
 * @property {string} [value] - The currently selected date string (ISO format YYYY-MM-DD or similar).
 * @property {(date: string) => void} [onChange] - Callback function triggered when a new date is confirmed.
 * @property {string} [placeholder] - Placeholder text for the input field.
 * @property {string} [className] - Optional CSS classes for the container.
 * @property {boolean} [disabled] - Disables the date picker interaction.
 */
interface DatePickerScrollProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

/**
 * DatePickerScroll
 * 
 * A custom mobile-friendly date picker component that uses scrollable columns (iOS style)
 * for selecting Day, Month, and Year. It includes a modal overlay, automated scroll snapping,
 * and visual highlighting of the selected item.
 */
export function DatePickerScroll({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  className,
  disabled = false
}: DatePickerScrollProps) {
  // State to manage the open/closed visibility of the modal
  const [isOpen, setIsOpen] = React.useState(false)

  // Internal state for the committed selected date.
  // Initialized from the `value` prop if present.
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(
    value ? new Date(value + 'T00:00:00') : null
  )

  // Temporary state for the scrolling selectors. 
  // These track values while the user is interacting effectively "staging" the changes before confirmation.
  const [tempMonth, setTempMonth] = React.useState(selectedDate?.getMonth() || new Date().getMonth())
  const [tempDay, setTempDay] = React.useState(selectedDate?.getDate() || new Date().getDate())
  const [tempYear, setTempYear] = React.useState(selectedDate?.getFullYear() || new Date().getFullYear())

  // Refs for the scroll containers to calculate center positions and handle scroll events.
  // Typed as HTMLDivElement | null to satisfy strict null checks.
  const datePickerRef = React.useRef<HTMLDivElement>(null)
  const dayScrollRef = React.useRef<HTMLDivElement>(null)
  const monthScrollRef = React.useRef<HTMLDivElement>(null)
  const yearScrollRef = React.useRef<HTMLDivElement>(null)

  /**
   * Effect: Handle clicks outside the component to close the picker.
   * Listens for 'mousedown' events on the document.
   */
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the modal/picker is open and the click target is NOT inside the component, close it.
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  /**
   * Effect: Synchronize internal state when the external `value` prop changes.
   * This ensures the picker reflects the current controlled value.
   */
  React.useEffect(() => {
    if (value) {
      // Append time to ensure local date interpretation involves no timezone shifts if just date is passed
      const date = new Date(value + 'T00:00:00')
      setSelectedDate(date)
      setTempMonth(date.getMonth())
      setTempDay(date.getDate())
      setTempYear(date.getFullYear())
    }
  }, [value])

  /**
   * Format a Date object for display in the input field.
   * Returns a localized string (es-ES).
   */
  const formatDate = (date: Date | null) => {
    if (!date) return ""
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  /**
   * Format a Date object to a standard string format (YYYY-MM-DD) for the onChange callback.
   */
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

  // --- Data Generation for Selectors ---

  // Generate month options
  const months = monthNames.map((name, index) => ({ value: index, label: name }))

  // Generate year options: standard implementation usually ranges from 1900 to Future
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1900 + 2 }, (_, i) => ({
    value: currentYear + 1 - i,
    label: (currentYear + 1 - i).toString()
  }))

  /**
   * Helper to calculate the number of days in a specific month of a year.
   * Important for handling leap years and different month lengths (28, 30, 31).
   */
  const getDaysInMonth = (month: number, year: number) => {
    // day 0 of the *next* month is the last day of the *current* month
    return new Date(year, month + 1, 0).getDate()
  }

  const daysInMonth = getDaysInMonth(tempMonth, tempYear)
  const days = Array.from({ length: daysInMonth }, (_, i) => ({
    value: i + 1,
    label: (i + 1).toString()
  }))

  /**
   * Effect: Auto-correct the selected day if the month/year changes.
   * Example: Switching from March 31st to February -> should clamp day to 28th (or 29th).
   */
  React.useEffect(() => {
    const maxDays = getDaysInMonth(tempMonth, tempYear)
    if (tempDay > maxDays) {
      setTempDay(maxDays)
    }
  }, [tempMonth, tempYear, tempDay])

  /**
   * Core Logic: Calculate the selected item based on the scroll position.
   * 
   * This simulates a "snap-to-center" logic where the item currently residing in the 
   * middle of the scroll container is considered "selected".
   * 
   * @param containerRef Reference to the scroll container DOM element
   * @param items Array of available items in the list
   * @returns The 'value' of the center-most item
   */
  const getCenterValueFromScroll = (containerRef: React.RefObject<HTMLDivElement | null>, items: { value: number; label: string }[]) => {
    if (!containerRef.current) return items[0]?.value || 0

    const container = containerRef.current
    const scrollTop = container.scrollTop
    const itemHeight = 40        // Matches the CSS height of each item
    const paddingTop = 80        // Matches the container padding (py-20 which is 5rem/80px)
    const containerHeight = container.clientHeight

    // Calculate which item index is currently at the visual center:
    // 1. Get visual center (scrollTop + half view height)
    // 2. Subtract padding to find relative position in the item list
    // 3. Divide by itemHeight to get approximate index
    const centerPosition = scrollTop + containerHeight / 2
    const rawIndex = (centerPosition - paddingTop) / itemHeight
    const centerIndex = Math.round(rawIndex) - 1  // Adjustment (-1) to align perfectly with visual snap

    // Clamp index to array bounds to prevent errors
    const clampedIndex = Math.max(0, Math.min(items.length - 1, centerIndex))

    return items[clampedIndex]?.value || items[0]?.value || 0
  }

  /**
   * Handle Confirm Action
   * Locks in the currently scrolled values, updates the official state, and calls onChange.
   */
  const handleConfirm = () => {
    // We force a recalculation of the values based on scroll positions to ensure 
    // we capture exactly what the user sees, even if the onScroll event didn't fire its last tick.
    const centerDay = getCenterValueFromScroll(dayScrollRef, days)
    const centerMonth = getCenterValueFromScroll(monthScrollRef, months)
    const centerYear = getCenterValueFromScroll(yearScrollRef, years)

    const newDate = new Date(centerYear, centerMonth, centerDay)

    setSelectedDate(newDate)
    onChange?.(formatDateToString(newDate))
    setIsOpen(false)
  }

  /**
   * Handle Cancel Action
   * Reverts temporary state back to the official `selectedDate` or Today.
   */
  const handleCancel = () => {
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

  // --- Sub-Component: Scroll Selector ---

  /**
   * ScrollSelector
   * Reusable component for the scrollable list of items (Day, Month, Year).
   * Handles auto-scrolling to initial value and visual highlighting.
   */
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
    const itemHeight = 40 // Consistent with the parent logic

    // Connect the internal local ref to the parent's passed ref
    React.useEffect(() => {
      if (scrollRef && containerRef.current) {
        (scrollRef as any).current = containerRef.current
      }
    }, [scrollRef])

    // Effect: Initial scroll positioning
    // When the component mounts or value changes externally, scroll to the correct item.
    React.useEffect(() => {
      if (containerRef.current) {
        const selectedIndex = items.findIndex(item => item.value === value)
        if (selectedIndex !== -1) {
          containerRef.current.scrollTo({
            // Scroll so the item is centered. 
            // -itemHeight * 2 offsets the padding to center it visually.
            top: selectedIndex * itemHeight - itemHeight * 2,
            behavior: 'smooth'
          })
        }
      }
    }, [value, items])

    // Effect: Scroll Event Listener
    // Tracks scroll position to update the 'highlighted' center value in real-time.
    React.useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const updateCenterValue = () => {
        const scrollTop = container.scrollTop
        const containerHeight = container.clientHeight
        const centerPosition = scrollTop + containerHeight / 2
        const paddingTop = 80 // py-20

        const rawIndex = (centerPosition - paddingTop) / itemHeight
        const centerIndex = Math.round(rawIndex) - 1
        const clampedIndex = Math.max(0, Math.min(items.length - 1, centerIndex))

        setCenterValue(items[clampedIndex]?.value || value)
      }

      const handleScroll = () => {
        updateCenterValue()
      }

      container.addEventListener('scroll', handleScroll, { passive: true })
      updateCenterValue() // Initial calculation

      return () => container.removeEventListener('scroll', handleScroll)
    }, [items, value])

    return (
      <div className={cn("relative", selectorClassName)}>
        <div
          ref={containerRef}
          className="h-48 overflow-y-scroll overflow-x-hidden scrollbar-hide"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          {/* Padding is essential to allow the first and last items to reach the center */}
          <div className="py-20">
            {items.map((item) => (
              <div
                key={item.value}
                className={cn(
                  "h-10 flex items-center justify-center transition-all duration-200",
                  "text-base font-medium select-none",
                  // Highlight logic: scale and color change if it's the center item
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
        {/* Visual Overlay: The selection window (horizontal lines) */}
        <div className="absolute inset-0 pointer-events-none flex items-center">
          <div className="w-full h-10 border-t border-b border-border bg-accent/20"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)} ref={datePickerRef}>
      {/* Trigger Input and Button */}
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

      {/* Modal Popup */}
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <div className="fixed inset-0 bg-black/50 z-40" onClick={handleCancel} />

          {/* Modal Container */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-card border border-border rounded-2xl shadow-professional-lg z-50 max-w-sm mx-auto">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-center text-foreground">
                Seleccionar Fecha
              </h3>
            </div>

            {/* Selectors Grid */}
            <div className="grid grid-cols-3 gap-2 p-4">
              {/* Day Column */}
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-2">Día</div>
                <ScrollSelector
                  items={days}
                  value={tempDay}
                  onChange={setTempDay}
                  scrollRef={dayScrollRef}
                />
              </div>

              {/* Month Column */}
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-2">Mes</div>
                <ScrollSelector
                  items={months}
                  value={tempMonth}
                  onChange={setTempMonth}
                  scrollRef={monthScrollRef}
                />
              </div>

              {/* Year Column */}
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

            {/* Footer Buttons */}
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
