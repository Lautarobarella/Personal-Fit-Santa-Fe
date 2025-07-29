"use client"

import React from "react"

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
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, Users, Loader2 } from "lucide-react"
import { ActivityFormType } from "@/lib/types"
import { useActivities } from "@/hooks/use-activity"

export default function EditActivityPage({ params }: { params: { id: number } }) {

  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const {
    form,
    setForm,
    selectedActivity,
    editActivity,
    loadActivityDetail,
    trainers,
    loadTrainers } = useActivities()
    
  useEffect(() => {
    loadTrainers()
    loadActivityDetail(params.id)
    if (selectedActivity) {
      setForm({
        id: selectedActivity.id.toString(),
        name: selectedActivity.name,
        description: selectedActivity.description,
        trainerId: selectedActivity.trainerId.toString(),
        location: selectedActivity.location,
        date: selectedActivity.date.toISOString().split("T")[0], // YYYY-MM-DD
        time: selectedActivity.date.toISOString().split("T")[1].slice(0, 5), // HH:MM
        duration: selectedActivity.duration.toString(),
        maxParticipants: selectedActivity.maxParticipants.toString(),
      })
    }
  }, [params.id])

  const [errors, setErrors] = useState<Partial<ActivityFormType>>({})

  if (!user || (user.role !== "admin" && user.role !== "trainer")) {
    return <div>No tienes permisos para crear actividades</div>
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ActivityFormType> = {}

    try {
      if (!form.name.trim()) newErrors.name = "El nombre es requerido"
      if (!form.description.trim()) newErrors.description = "La descripción es requerida"
      if (!form.date) newErrors.date = "La fecha es requerida"
      if (!form.time) newErrors.time = "La hora es requerida"
      if (!form.duration) newErrors.duration = "La duración debe ser mayor a 0"
      if (!form.maxParticipants) newErrors.maxParticipants = "El número de participantes debe ser mayor a 0"
      if (!form.trainerId.trim()) newErrors.trainerId = "El entrenador es requerido"

      // Validate date is not in the past
      const selectedDate = new Date(`${form.date}T${form.time}`)
      if (selectedDate <= new Date()) {
        newErrors.date = "La fecha debe ser futura"
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
      editActivity(form)
      toast({
        title: "Actividad creada",
        description: "La actividad ha sido creada exitosamente",
      })

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

  const handleInputChange = (field: keyof Partial<ActivityFormType>, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Nueva Actividad" showBack onBack={() => router.back()} />

      <div className="container py-6">
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
                <h3 className="text-lg font-medium">Información Básica</h3>

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
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horario
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className={errors.date ? "border-destructive" : ""}
                    />
                    {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                  </div>

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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Select
                    value={form.duration.toString()}
                    onValueChange={(value) => handleInputChange("duration", Number.parseInt(value))}
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
              </div>

              {/* Capacity & Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
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
