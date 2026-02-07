"use client"

import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useActivityContext } from "@/contexts/activity-provider"
import { useToast } from "@/hooks/use-toast"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getMuscleGroupLabel, MUSCLE_GROUP_OPTIONS } from "@/lib/muscle-groups"
import { ActivityStatus, MuscleGroup, UserRole, type ActivitySummaryRequest } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, ClipboardList, Dumbbell, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { type FormEvent, useEffect, useMemo, useState } from "react"

interface ActivitySummaryPageProps {
  params: Promise<{
    id: string
  }>
}

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
  const [isMuscleGroupComboboxOpen, setIsMuscleGroupComboboxOpen] = useState(false)
  const [summaryForm, setSummaryForm] = useState<ActivitySummaryRequest>({
    muscleGroups: [MuscleGroup.PECHO],
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
          const resolvedMuscleGroups = currentSummary.muscleGroups?.length
            ? currentSummary.muscleGroups
            : currentSummary.muscleGroup
              ? [currentSummary.muscleGroup]
              : [MuscleGroup.PECHO]

          setHasExistingSummary(true)
          setSummaryForm({
            muscleGroups: resolvedMuscleGroups,
            muscleGroup: resolvedMuscleGroups[0],
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
    const normalizedMuscleGroups = [...new Set(summaryForm.muscleGroups)].filter(Boolean)

    if (normalizedMuscleGroups.length === 0) {
      toast({
        title: "Falta grupo muscular",
        description: "Selecciona al menos un grupo muscular trabajado.",
        variant: "destructive",
      })
      return
    }

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
        muscleGroups: normalizedMuscleGroups,
        muscleGroup: normalizedMuscleGroups[0],
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

  const selectedMuscleGroupLabels = useMemo(() => {
    if (summaryForm.muscleGroups.length === 0) {
      return "Seleccionar grupo muscular"
    }

    if (summaryForm.muscleGroups.length <= 2) {
      return summaryForm.muscleGroups.map(getMuscleGroupLabel).join(", ")
    }

    return `${summaryForm.muscleGroups.slice(0, 2).map(getMuscleGroupLabel).join(", ")} +${summaryForm.muscleGroups.length - 2}`
  }, [summaryForm.muscleGroups])

  const toggleMuscleGroup = (group: MuscleGroup) => {
    setSummaryForm((previous) => {
      const currentGroups = previous.muscleGroups ?? []
      const alreadySelected = currentGroups.includes(group)
      const nextGroups = alreadySelected
        ? currentGroups.filter((currentGroup) => currentGroup !== group)
        : [...currentGroups, group]

      return {
        ...previous,
        muscleGroups: nextGroups,
        muscleGroup: nextGroups[0],
      }
    })
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
                <Popover open={isMuscleGroupComboboxOpen} onOpenChange={setIsMuscleGroupComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between bg-transparent font-normal"
                    >
                      <span className="truncate text-left">{selectedMuscleGroupLabels}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar grupo muscular..." />
                      <CommandList>
                        <CommandEmpty>Sin resultados.</CommandEmpty>
                        <CommandGroup>
                          {MUSCLE_GROUP_OPTIONS.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.label}
                              onSelect={() => toggleMuscleGroup(option.value)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  summaryForm.muscleGroups.includes(option.value) ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {option.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {summaryForm.muscleGroups.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Seleccionados: {summaryForm.muscleGroups.map(getMuscleGroupLabel).join(", ")}
                  </p>
                )}
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
