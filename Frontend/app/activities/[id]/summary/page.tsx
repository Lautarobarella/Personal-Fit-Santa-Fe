"use client"

import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useActivityContext } from "@/contexts/activity-provider"
import { useToast } from "@/hooks/use-toast"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { ActivityStatus, MuscleGroup, UserRole, type ActivitySummaryRequest } from "@/lib/types"
import { ClipboardList, Dumbbell, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { type FormEvent, useEffect, useMemo, useState } from "react"

interface ActivitySummaryPageProps {
  params: Promise<{
    id: string
  }>
}

const muscleGroupOptions = [
  { value: MuscleGroup.PECHO, label: "Pecho" },
  { value: MuscleGroup.ESPALDA, label: "Espalda" },
  { value: MuscleGroup.BICEP, label: "Biceps" },
  { value: MuscleGroup.ABDOMINALES, label: "Abdominales" },
  { value: MuscleGroup.ADUCTORES, label: "Aductores" },
  { value: MuscleGroup.CUADRICEPS, label: "Cuadriceps" },
  { value: MuscleGroup.GEMELOS, label: "Gemelos" },
  { value: MuscleGroup.ISQUIOS, label: "Isquios" },
  { value: MuscleGroup.HOMBROS, label: "Hombros" },
  { value: MuscleGroup.TRICEP, label: "Triceps" },
  { value: MuscleGroup.CARDIO_FUNCIONAL, label: "Cardio / Funcional" },
]

export default function ActivitySummaryPage({ params }: ActivitySummaryPageProps) {
  const { user } = useRequireAuth()
  const router = useRouter()
  const { toast } = useToast()
  const {
    selectedActivity,
    loadActivityDetail,
    getMySummary,
    saveActivitySummary,
    isSavingSummary,
  } = useActivityContext()

  const [activityId, setActivityId] = useState<number | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [hasExistingSummary, setHasExistingSummary] = useState(false)
  const [summaryForm, setSummaryForm] = useState<ActivitySummaryRequest>({
    muscleGroup: MuscleGroup.PECHO,
    effortLevel: 5,
    trainingDescription: "",
  })

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      const parsedId = Number.parseInt(resolvedParams.id, 10)

      if (Number.isNaN(parsedId)) {
        toast({
          title: "Error",
          description: "No se pudo identificar la actividad.",
          variant: "destructive",
        })
        router.push("/activities")
        return
      }

      setActivityId(parsedId)
    }

    resolveParams()
  }, [params, router, toast])

  useEffect(() => {
    if (!user) {
      return
    }

    if (user.role !== UserRole.CLIENT) {
      toast({
        title: "Acceso denegado",
        description: "Solo clientes pueden completar resumenes de entrenamiento.",
        variant: "destructive",
      })
      router.push("/activities")
    }
  }, [router, toast, user])

  useEffect(() => {
    const loadData = async () => {
      if (!activityId || !user || user.role !== UserRole.CLIENT) {
        return
      }

      setIsLoadingData(true)
      try {
        await loadActivityDetail(activityId)

        const currentSummary = await getMySummary(activityId)
        if (currentSummary) {
          setHasExistingSummary(true)
          setSummaryForm({
            muscleGroup: currentSummary.muscleGroup,
            effortLevel: currentSummary.effortLevel,
            trainingDescription: currentSummary.trainingDescription,
          })
        }
      } catch {
        toast({
          title: "No disponible",
          description: "No se pudo cargar el resumen para esta actividad.",
          variant: "destructive",
        })
        router.push("/activities")
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [activityId, getMySummary, loadActivityDetail, router, toast, user])

  const canSubmitSummary = useMemo(() => {
    if (!user || !selectedActivity || activityId !== selectedActivity.id) {
      return false
    }

    const isEnrolled = selectedActivity.participants.some((participant) => participant.userId === user.id)
    const isCompletedOrPast =
      selectedActivity.status === ActivityStatus.COMPLETED || new Date(selectedActivity.date) < new Date()

    return isEnrolled && isCompletedOrPast && selectedActivity.status !== ActivityStatus.CANCELLED
  }, [activityId, selectedActivity, user])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!activityId) {
      return
    }

    if (!canSubmitSummary) {
      toast({
        title: "No disponible",
        description: "Solo podes resumir actividades finalizadas donde estes inscripto.",
        variant: "destructive",
      })
      return
    }

    const normalizedDescription = summaryForm.trainingDescription.trim()
    if (!normalizedDescription) {
      toast({
        title: "Falta descripcion",
        description: "Escribi un breve resumen del entrenamiento realizado.",
        variant: "destructive",
      })
      return
    }

    try {
      await saveActivitySummary(activityId, {
        ...summaryForm,
        trainingDescription: normalizedDescription,
      })

      toast({
        title: hasExistingSummary ? "Resumen actualizado" : "Resumen guardado",
        description: "Tu resumen quedo registrado correctamente.",
      })
      router.push("/activities")
    } catch {
      toast({
        title: "Error",
        description: "No se pudo guardar el resumen. Intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  if (!user || user.role !== UserRole.CLIENT) {
    return null
  }

  if (isLoadingData || !activityId || !selectedActivity || selectedActivity.id !== activityId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Resumen de Actividad" showBack onBack={() => router.back()} />

      <div className="container-centered py-6">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {selectedActivity.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{selectedActivity.description}</p>
            <p>Entrenador: {selectedActivity.trainerName}</p>
          </CardContent>
        </Card>

        <Card className="mb-24">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              {hasExistingSummary ? "Editar Resumen" : "Indicar Resumen"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Grupo muscular trabajado</Label>
                <Select
                  value={summaryForm.muscleGroup}
                  onValueChange={(value) =>
                    setSummaryForm((previous) => ({
                      ...previous,
                      muscleGroup: value as MuscleGroup,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar grupo muscular" />
                  </SelectTrigger>
                  <SelectContent>
                    {muscleGroupOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Nivel de esfuerzo: {summaryForm.effortLevel}/10</Label>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[summaryForm.effortLevel]}
                  onValueChange={(value) =>
                    setSummaryForm((previous) => ({
                      ...previous,
                      effortLevel: value[0] ?? previous.effortLevel,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trainingDescription">Descripcion del entrenamiento</Label>
                <Textarea
                  id="trainingDescription"
                  value={summaryForm.trainingDescription}
                  onChange={(event) =>
                    setSummaryForm((previous) => ({
                      ...previous,
                      trainingDescription: event.target.value,
                    }))
                  }
                  rows={5}
                  maxLength={2500}
                  placeholder="Contanos como fue el entrenamiento, ejercicios destacados o sensaciones."
                />
              </div>

              {!canSubmitSummary && (
                <p className="text-sm text-destructive">
                  Esta actividad aun no esta habilitada para resumen o no estas inscripto.
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 bg-transparent"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSavingSummary || !canSubmitSummary}>
                  {isSavingSummary && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {hasExistingSummary ? "Actualizar resumen" : "Guardar resumen"}
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
