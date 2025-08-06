"use client"

import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

interface WeeklyScheduleDisplayProps {
  weeklySchedule: boolean[]
  className?: string
}

const DAYS_OF_WEEK = [
  { key: 0, label: "Lun", full: "Lunes" },
  { key: 1, label: "Mar", full: "Martes" },
  { key: 2, label: "Mié", full: "Miércoles" },
  { key: 3, label: "Jue", full: "Jueves" },
  { key: 4, label: "Vie", full: "Viernes" },
  { key: 5, label: "Sáb", full: "Sábado" },
  { key: 6, label: "Dom", full: "Domingo" },
]

export function WeeklyScheduleDisplay({ weeklySchedule, className = "" }: WeeklyScheduleDisplayProps) {
  const selectedDays = weeklySchedule
    .map((selected, index) => selected ? DAYS_OF_WEEK[index] : null)
    .filter(day => day !== null)

  if (selectedDays.length === 0) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1">
        {selectedDays.map((day, index) => (
          <Badge key={day?.key} variant="secondary" className="text-xs">
            {day?.label}
          </Badge>
        ))}
      </div>
    </div>
  )
} 