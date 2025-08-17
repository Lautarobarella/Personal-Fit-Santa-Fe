"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useActivities } from "@/hooks/use-activity"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/lib/types"
import { ArrowLeft, Calendar, Clock, MapPin, Save, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface EditActivityPageProps {
  params: {
    id: string
  }
}

const DAYS_OF_WEEK = [
  { label: "Lunes", value: 0 },
  { label: "Martes", value: 1 },
  { label: "Miércoles", value: 2 },
  { label: "Jueves", value: 3 },
  { label: "Viernes", value: 4 },
  { label: "Sábado", value: 5 },
  { label: "Domingo", value: 6 },
]

export default function EditActivityPage({ params }: EditActivityPageProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const activityId = parseInt(params.id)

  const {
    selectedActivity,
    form,
    setForm,
    trainers,
    loading,
    error,
    loadActivityDetail,
    loadTrainers,
    editActivity,
    clearSelectedActivity,
  } = useActivities()

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Verificar permisos - solo ADMIN puede acceder
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para editar actividades",
        variant: "destructive",
      })
      router.push("/activities")
      return
    }
  }, [user, router, toast])

  // Cargar datos iniciales
  useEffect(() => {
    if (activityId && user?.role === UserRole.ADMIN) {
      loadActivityDetail(activityId)
      loadTrainers()
    }
  }, [activityId, user?.role, loadActivityDetail, loadTrainers])

  // Poblar formulario cuando se carga la actividad
  useEffect(() => {
    if (selectedActivity) {
      const activityDate = new Date(selectedActivity.date)
      const dateStr = activityDate.toISOString().split('T')[0]
      const timeStr = activityDate.toTimeString().slice(0, 5)

      setForm({
        name: selectedActivity.name,
        description: selectedActivity.description,
        location: selectedActivity.location,
        trainerId: selectedActivity.trainerId?.toString() || "",
        date: dateStr,
        time: timeStr,
        duration: selectedActivity.duration?.toString() || "",
        maxParticipants: selectedActivity.maxParticipants?.toString() || "",
        isRecurring: selectedActivity.isRecurring || false,
        weeklySchedule: selectedActivity.weeklySchedule || [false, false, false, false, false, false, false],
      })
    }
  }, [selectedActivity, setForm])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      clearSelectedActivity()
    }
  }, [clearSelectedActivity])

  const handleWeeklyScheduleChange = (dayIndex: number, checked: boolean) => {
    const newSchedule = [...(form.weeklySchedule || [false, false, false, false, false, false, false])]
    newSchedule[dayIndex] = checked
    setForm({ ...form, weeklySchedule: newSchedule })
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

    setIsSubmitting(true)

    try {
      await editActivity(activityId, form)
      
      toast({
        title: "Actividad actualizada",
        description: "Los cambios se han guardado correctamente y se aplicarán a futuras repeticiones",
      })
      
      router.push("/activities")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la actividad. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user?.role !== UserRole.ADMIN) {
    return null // El useEffect ya redirige, esto evita flash
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <MobileHeader title="Editar Actividad" showBack />
        <div className="container-centered py-6">
          <div className="flex justify-center items-center h-48">
            <div className="text-muted-foreground">Cargando actividad...</div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (error || !selectedActivity) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <MobileHeader title="Editar Actividad" showBack />
        <div className="container-centered py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                {error || "No se pudo cargar la actividad"}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push("/activities")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Actividades
              </Button>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title="Editar Actividad" showBack />
      
      <div className="container-centered py-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Información de la Actividad
              </CardTitle>
              <CardDescription>
                Modifica los datos básicos de la actividad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Yoga matutino"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción de la actividad..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="location">Ubicación *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Ej: Salón principal"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructor y Programación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Instructor y Horario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="trainer">Instructor *</Label>
                <Select value={form.trainerId} onValueChange={(value) => setForm({ ...form, trainerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id.toString()}>
                        {trainer.firstName} {trainer.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Fecha *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="time">Hora *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="time"
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duración (minutos) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="60"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="maxParticipants">Máx. Participantes *</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={form.maxParticipants}
                    onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                    placeholder="20"
                    min="1"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Repetición Semanal */}
          <Card>
            <CardHeader>
              <CardTitle>Repetición Semanal</CardTitle>
              <CardDescription>
                Configura si esta actividad se repite cada semana. Los cambios se aplicarán a futuras creaciones.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={form.isRecurring}
                  onCheckedChange={(checked) => setForm({ ...form, isRecurring: checked })}
                />
                <Label htmlFor="recurring">Repetir cada semana</Label>
              </div>

              {form.isRecurring && (
                <div>
                  <Label>Días de la semana</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Switch
                          id={`day-${day.value}`}
                          checked={(form.weeklySchedule || [])[day.value] || false}
                          onCheckedChange={(checked) => handleWeeklyScheduleChange(day.value, checked)}
                        />
                        <Label htmlFor={`day-${day.value}`} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/activities")}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </div>

      <BottomNav />
    </div>
  )
}
