"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Calendar, Clock, Users, Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ActivityForm {
  name: string
  description: string
  date: string
  time: string
  duration: number
  maxParticipants: number
  price: number
  trainer: string
}

// Mock activity data - in real app, this would come from API
const mockActivity = {
  id: "1",
  name: "Yoga Matutino",
  description: "Clase de yoga para principiantes",
  trainer: "Ana García",
  trainerId: "2",
  date: new Date("2024-01-15T09:00:00"),
  duration: 60,
  maxParticipants: 15,
  currentParticipants: 12,
  price: 25,
  status: "active" as const,
  participants: ["3", "4", "5"],
}

export default function EditActivityPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activity, setActivity] = useState(mockActivity)

  const [form, setForm] = useState<ActivityForm>({
    name: "",
    description: "",
    date: "",
    time: "",
    duration: 60,
    maxParticipants: 10,
    price: 0,
    trainer: "",
  })

  const [errors, setErrors] = useState<Partial<ActivityForm>>({})

  useEffect(() => {
    // Load activity data
    if (activity) {
      const activityDate = new Date(activity.date)
      setForm({
        name: activity.name,
        description: activity.description,
        date: activityDate.toISOString().split("T")[0],
        time: activityDate.toTimeString().slice(0, 5),
        duration: activity.duration,
        maxParticipants: activity.maxParticipants,
        price: activity.price,
        trainer: activity.trainer,
      })
    }
  }, [activity])

  if (!user || (user.role !== "administrator" && user.role !== "trainer")) {
    return <div>No tienes permisos para editar actividades</div>
  }

  // Check if user can edit this specific activity
  if (user.role === "trainer" && activity.trainerId !== user.id) {
    return <div>No tienes permisos para editar esta actividad</div>
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ActivityForm> = {}

    if (!form.name.trim()) newErrors.name = "El nombre es requerido"
    if (!form.description.trim()) newErrors.description = "La descripción es requerida"
    if (!form.date) newErrors.date = "La fecha es requerida"
    if (!form.time) newErrors.time = "La hora es requerida"
    if (form.duration <= 0) newErrors.duration = "La duración debe ser mayor a 0"
    if (form.maxParticipants <= 0) newErrors.maxParticipants = "El número de participantes debe ser mayor a 0"
    if (form.maxParticipants < activity.currentParticipants) {
      newErrors.maxParticipants = `No puedes reducir la capacidad por debajo de ${activity.currentParticipants} (participantes actuales)`
    }
    if (form.price < 0) newErrors.price = "El precio no puede ser negativo"
    if (!form.trainer.trim()) newErrors.trainer = "El entrenador es requerido"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const updatedActivity = {
        ...activity,
        ...form,
        date: new Date(`${form.date}T${form.time}`),
      }

      console.log("Updating activity:", updatedActivity)

      toast({
        title: "Actividad actualizada",
        description: "Los cambios han sido guardados exitosamente",
      })

      router.push("/activities")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la actividad",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof ActivityForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const hasParticipants = activity.currentParticipants > 0

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Editar Actividad" showBack onBack={() => router.back()} />

      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Modificar Actividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasParticipants && (
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Esta actividad tiene {activity.currentParticipants} participantes inscritos. Ten cuidado al modificar
                  la fecha, hora o capacidad.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Información Básica</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Actividad *</Label>
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
                  <Label htmlFor="description">Descripción *</Label>
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

                {user.role === "administrator" && (
                  <div className="space-y-2">
                    <Label htmlFor="trainer">Entrenador *</Label>
                    <Select value={form.trainer} onValueChange={(value) => handleInputChange("trainer", value)}>
                      <SelectTrigger className={errors.trainer ? "border-destructive" : ""}>
                        <SelectValue placeholder="Seleccionar entrenador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ana García">Ana García</SelectItem>
                        <SelectItem value="Carlos López">Carlos López</SelectItem>
                        <SelectItem value="María Rodríguez">María Rodríguez</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.trainer && <p className="text-sm text-destructive">{errors.trainer}</p>}
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
                    <Label htmlFor="date">Fecha *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className={errors.date ? "border-destructive" : ""}
                    />
                    {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Hora *</Label>
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
                  <Label htmlFor="duration">Duración (minutos) *</Label>
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
                  Capacidad y Precio
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Máximo Participantes *</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      min={activity.currentParticipants}
                      max="50"
                      value={form.maxParticipants}
                      onChange={(e) => handleInputChange("maxParticipants", Number.parseInt(e.target.value) || 0)}
                      className={errors.maxParticipants ? "border-destructive" : ""}
                    />
                    {errors.maxParticipants && <p className="text-sm text-destructive">{errors.maxParticipants}</p>}
                    <p className="text-xs text-muted-foreground">
                      Participantes actuales: {activity.currentParticipants}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Precio ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value) || 0)}
                      className={errors.price ? "border-destructive" : ""}
                    />
                    {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 bg-transparent">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
