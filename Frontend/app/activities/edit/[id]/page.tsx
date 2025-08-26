"use client"

import { useAuth } from "@/contexts/auth-provider"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { TimePicker } from "@/components/ui/time-picker"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/lib/types"
import { Calendar, Clock, Loader2, Repeat, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useActivityContext } from "@/contexts/activity-provider"

interface EditActivityPageProps {
    params: Promise<{
        id: string
    }>
}

export default function EditActivityPage({ params }: EditActivityPageProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const {
    form,
    setForm,
    trainers,
    selectedActivity,
    loading,
    error,
    updateActivity,
    loadActivityDetail,
    loadTrainers,
    resetForm,
  } = useActivityContext()

  const [isLoading, setIsLoading] = useState(false)
  const [activityId, setActivityId] = useState<string | null>(null)

  // Obtener el ID del parámetro async
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setActivityId(resolvedParams.id)
    }
    getParams()
  }, [params])

  // Verificar permisos y cargar datos - solo ADMIN puede acceder
  useEffect(() => {
    if (user && user.role === UserRole.ADMIN && activityId) {
      loadActivityDetail(parseInt(activityId))
      loadTrainers()
    } else if (user && user.role !== UserRole.ADMIN) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para editar actividades",
        variant: "destructive",
      })
      router.push("/activities")
      return
    }
  }, [user, activityId, router, toast, loadActivityDetail, loadTrainers])

  // Poblar el formulario cuando se cargan los detalles de la actividad
  useEffect(() => {
    if (selectedActivity && selectedActivity.id.toString() === activityId) {
      const activityDate = new Date(selectedActivity.date)
      const dateString = activityDate.toISOString().split('T')[0] // YYYY-MM-DD
      const timeString = activityDate.toTimeString().slice(0, 5) // HH:MM
      
      setForm({
        id: selectedActivity.id.toString(),
        name: selectedActivity.name,
        description: selectedActivity.description || "",
        location: selectedActivity.location || "",
        trainerId: selectedActivity.trainerId?.toString() || "",
        date: dateString,
        time: timeString,
        duration: selectedActivity.duration.toString(),
        maxParticipants: selectedActivity.maxParticipants.toString(),
        isRecurring: selectedActivity.isRecurring || false,
      })
    }
  }, [selectedActivity, activityId, setForm])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      resetForm()
    }
  }, [resetForm])

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

    if (!activityId) {
      toast({
        title: "Error",
        description: "ID de actividad no encontrado",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Extraer id del form para evitar enviarlo en el payload
      const { id, ...activityData } = form
      await updateActivity(parseInt(activityId), activityData)

      toast({
        title: "Actividad actualizada",
        description: "La actividad ha sido actualizada exitosamente",
      })

      router.push("/activities")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la actividad. Intenta nuevamente.",
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
      <MobileHeader title="Editar Actividad" showBack onBack={() => router.back()} />

      <div className="container-centered py-6">
        <Card className="mb-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Editar Actividad
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
                  <DatePicker
                    value={form.date}
                    onChange={(date) => handleInputChange("date", date)}
                    disablePastDates={true}
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
                  <TimePicker
                    value={form.time}
                    onChange={(time) => handleInputChange("time", time)}
                    selectedDate={form.date}
                    disablePastTimes={true}
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
              <div className="space-y-4 pt-4">
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
                {/* Leyenda explicativa */}
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">¿Cómo funciona?</span>
                    <br />
                    Si activas esta opción, una vez que la actividad termine, se creará automáticamente una actividad idéntica para la próxima semana en el mismo día y horario.
                  </p>
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-4">
                <h3 className="text-md font-medium flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Capacidad
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Máxima cantidad de participantes</Label>
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
                  Actualizar Actividad
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
