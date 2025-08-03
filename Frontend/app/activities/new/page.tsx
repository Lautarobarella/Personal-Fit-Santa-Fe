"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, Users, Loader2, Repeat } from "lucide-react"
import { ActivityFormType } from "@/lib/types"
import { useActivities } from "@/hooks/use-activity"

const DAYS_OF_WEEK = [
  { key: 0, label: "Lunes", short: "Lun" },
  { key: 1, label: "Martes", short: "Mar" },
  { key: 2, label: "Miércoles", short: "Mié" },
  { key: 3, label: "Jueves", short: "Jue" },
  { key: 4, label: "Viernes", short: "Vie" },
  { key: 5, label: "Sábado", short: "Sáb" },
  { key: 6, label: "Domingo", short: "Dom" },
]

export default function NewActivityPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const { form, setForm, createActivity, loadTrainers, trainers, resetForm } = useActivities()
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  useEffect(() =>{ 
    loadTrainers()
  }, [])

  if (!user || (user.role !== "admin" && user.role !== "trainer")) {
    return <div>No tienes permisos para crear actividades</div>
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    try {
    if (!form.name.trim()) newErrors.name = "El nombre es requerido"
    if (!form.description.trim()) newErrors.description = "La descripción es requerida"
    if (!form.time) newErrors.time = "La hora es requerida"
    if (!form.duration) newErrors.duration = "La duración debe ser mayor a 0"
    if (!form.maxParticipants) newErrors.maxParticipants = "El número de participantes debe ser mayor a 0"
    if (!form.trainerId.trim()) form.trainerId = user.id.toString()

    // Validate recurring activity settings
    if (form.isRecurring) {
      if (!form.weeklySchedule?.some(day => day)) {
        newErrors.weeklySchedule = "Debe seleccionar al menos un día de la semana"
      }
    }
    } catch (error) {
      console.error("Error validating form:", error)
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      await createActivity(form)
      toast({
        title: "Actividad creada",
        description: "La actividad ha sido creada exitosamente",
      })

      resetForm()
      router.push("/activities")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la actividad",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof Partial<ActivityFormType>, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field if it exists
    if (errors[field as string]) {
      const newErrors = { ...errors }
      delete newErrors[field as string]
      setErrors(newErrors)
    }
  }

  const handleWeeklyScheduleChange = (dayIndex: number, checked: boolean) => {
    const newSchedule = [...(form.weeklySchedule || [false, false, false, false, false, false, false])]
    newSchedule[dayIndex] = checked
    setForm(prev => ({ ...prev, weeklySchedule: newSchedule }))
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Nueva Actividad" showBack onBack={() => router.back()} />

      <div className="container-centered py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Crear Nueva Actividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-md font-medium">Información Básica</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Actividad</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ej: Yoga Matutino"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe la actividad, nivel requerido, etc."
                    rows={3}
                    className={errors.description ? "border-destructive" : ""}
                  />
                  {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                </div>

                {user.role === "admin" && (
                  <div className="space-y-2">
                    <Label htmlFor="trainerName">Entrenador asignado</Label>

                    <Select value={form.trainerId} onValueChange={(value) => handleInputChange("trainerId", value)}>
                      <SelectTrigger className={errors.trainerId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Seleccionar entrenador" />
                      </SelectTrigger>
                      <SelectContent>                    
                        {trainers.map((trainer) => (
                            <SelectItem key={trainer.id} value={trainer.id.toString()}>
                              {trainer.firstName + " " + trainer.lastName}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select> 

                    {errors.trainerId && <p className="text-sm text-destructive">{errors.trainerId}</p>}
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <h3 className="text-md font-medium flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horario
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="time">Hora de inicio</Label>
                  <Input
                    id="time"
                    type="time"
                    value={form.time}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                    className={errors.time ? "border-destructive" : ""}
                  />
                  {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Select
                    value={form.duration.toString()}
                    onValueChange={(value) => handleInputChange("duration", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                      <SelectItem value="120">120 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.duration && <p className="text-sm text-destructive">{errors.duration}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Ej: Gimnasio principal"
                    className={errors.location ? "border-destructive" : ""}
                  />
                  {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
                </div>
              </div>

              {/* Recurring Schedule */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium flex items-center gap-2">
                    <Repeat className="h-5 w-5" />
                    Repetir semanalmente
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="recurring"
                      checked={form.isRecurring}
                      onCheckedChange={(checked) => handleInputChange("isRecurring", checked)}
                    />
                    
                  </div>
                </div>

                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Label>Días de la semana</Label>
                      <p className="text-sm text-muted-foreground">
                        Selecciona los días en los que se realizará esta actividad. Se crearán actividades separadas para cada día seleccionado.
                      </p>
                      <div className="grid grid-cols-7 gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <div key={day.key} className="flex flex-col items-center space-y-1">
                            <Checkbox
                              id={`day-${day.key}`}
                              checked={form.weeklySchedule?.[day.key] || false}
                              onCheckedChange={(checked) => 
                                handleWeeklyScheduleChange(day.key, checked as boolean)
                              }
                            />
                            <Label htmlFor={`day-${day.key}`} className="text-xs">
                              {day.short}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {errors.weeklySchedule && (
                        <p className="text-sm text-destructive">{errors.weeklySchedule}</p>
                      )}
                    </div>
                  </div>
              </div>

              {/* Capacity */}
              <div className="space-y-4">
                <h3 className="text-md font-medium flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Capacidad
                </h3>
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Máximo Participantes</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      min="1"
                      max="50"
                      value={form.maxParticipants}
                      onChange={(e) => handleInputChange("maxParticipants", Number.parseInt(e.target.value) || 0)}
                      className={errors.maxParticipants ? "border-destructive" : ""}
                    />
                    {errors.maxParticipants && <p className="text-sm text-destructive">{errors.maxParticipants}</p>}
                  </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 bg-transparent">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Actividad
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
