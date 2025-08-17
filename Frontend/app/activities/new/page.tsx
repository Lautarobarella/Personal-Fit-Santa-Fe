"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useActivities } from "@/hooks/use-activity"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/lib/types"
import { Calendar, Clock, Loader2, Repeat, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const DAYS_OF_WEEK = [
  { label: "Lunes", value: 0, key: 0, short: "L" },
  { label: "Martes", value: 1, key: 1, short: "M" },
  { label: "Miércoles", value: 2, key: 2, short: "X" },
  { label: "Jueves", value: 3, key: 3, short: "J" },
  { label: "Viernes", value: 4, key: 4, short: "V" },
  { label: "Sábado", value: 5, key: 5, short: "S" },
  { label: "Domingo", value: 6, key: 6, short: "D" }
]

export default function NewActivityPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const {
    form,
    setForm,
    trainers,
    loading,
    error,
    createActivity,
    loadTrainers,
    resetForm,
  } = useActivities()

  const [isLoading, setIsLoading] = useState(false)

  // Verificar permisos - solo ADMIN puede acceder
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para crear actividades",
        variant: "destructive",
      })
      router.push("/activities")
      return
    }
  }, [user, router, toast])

  // Cargar trainers al montar el componente
  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      loadTrainers()
    }
  }, [user?.role, loadTrainers])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      resetForm()
    }
  }, [resetForm])

  const handleWeeklyScheduleChange = (dayIndex: number, checked: boolean) => {
    const newSchedule = [...(form.weeklySchedule || [false, false, false, false, false, false, false])]
    newSchedule[dayIndex] = checked
    setForm({ ...form, weeklySchedule: newSchedule })
  }

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.name.trim() || !form.trainerId || !form.date || !form.time || !form.duration || !form.maxParticipants) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    if (parseInt(form.duration) <= 0 || parseInt(form.maxParticipants) <= 0) {
      toast({
        title: "Error",
        description: "La duración y cantidad máxima de participantes deben ser mayores a 0",
        variant: "destructive",
      })
      return
    }

    if (form.isRecurring && !(form.weeklySchedule || []).some(day => day)) {
      toast({
        title: "Error",
        description: "Para actividades recurrentes debes seleccionar al menos un día de la semana",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await createActivity(form)
      
      toast({
        title: "Actividad creada",
        description: "La actividad ha sido creada exitosamente",
      })
      
      router.push("/activities")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la actividad. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (user?.role !== UserRole.ADMIN) {
    return null
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe la actividad, nivel requerido, etc."
                    rows={3}
                  />
                </div>

                {user.role === UserRole.ADMIN && (
                  <div className="space-y-2">
                    <Label htmlFor="trainerName">Entrenador asignado</Label>

                    <Select value={form.trainerId} onValueChange={(value) => handleInputChange("trainerId", value)}>
                      <SelectTrigger>
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
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                  />
                </div>
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
                  />
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Ej: Gimnasio principal"
                  />
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

                {form.isRecurring && (
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
                    </div>
                  </div>
                )}
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
                    />
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

      <BottomNav />
    </div>
  )
}
