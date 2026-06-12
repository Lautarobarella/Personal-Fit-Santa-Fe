"use client"

import { useActivityEdit } from "@/hooks/activities/use-activity-edit"
import { UserRole } from "@/types"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { TimePicker } from "@/components/ui/time-picker"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"

interface EditActivityPageProps {
    params: Promise<{
        id: string
    }>
}

export default function EditActivityPage({ params }: EditActivityPageProps) {
  const {
    user,
    router,
    form,
    trainers,
    isLoading,
    handleInputChange,
    handleSubmit,
  } = useActivityEdit(params)

  if (user?.role !== UserRole.ADMIN) {
    return null
  }

  return (
    <div className="min-h-screen bg-background mb-32">
      <MobileHeader title="Editar Actividad" showBack onBack={() => router.back()} />

      <div className="container-centered py-6">
        <form onSubmit={handleSubmit} className="space-y-6" key="activity-form">
          {/* Información básica */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h3 className="text-base font-semibold">Información Básica</h3>
            </div>
            <div className="space-y-4 rounded-xl border p-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Actividad</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ej: Yoga Matutino"
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
          </section>

          {/* Horario */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
              <h3 className="text-base font-semibold">Horario</h3>
            </div>
            <div className="space-y-4 rounded-xl border p-4">
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
            </div>
          </section>

          {/* Repetición semanal */}
          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-primary" />
                <h3 className="text-base font-semibold">Repetir semanalmente</h3>
              </div>
              <Switch
                id="recurring"
                checked={form.isRecurring}
                onCheckedChange={(checked) => handleInputChange("isRecurring", checked)}
              />
            </div>
            {/* Leyenda explicativa */}
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <p className="leading-relaxed">
                <span className="font-medium text-foreground">¿Cómo funciona?</span>
                <br />
                Si activas esta opción, una vez que la actividad termine, se creará automáticamente una actividad idéntica para la próxima semana en el mismo día y horario.
              </p>
            </div>
          </section>

          {/* Capacidad */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
              <h3 className="text-base font-semibold">Capacidad</h3>
            </div>
            <div className="space-y-4 rounded-xl border p-4">
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
          </section>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Actualizar Actividad
            </Button>
          </div>
        </form>
      </div>

      <BottomNav />
    </div>
  )
}
