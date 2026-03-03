"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useActivityContext } from "@/contexts/activity-provider"
import { useToast } from "@/hooks/use-toast"
import { getMuscleGroupLabel } from "@/lib/muscle-groups"
import { ActivityStatus, MuscleGroup, UserRole, type ActivitySummaryRequest } from "@/types"

export function useActivitySummary(params: Promise<{ id: string }>) {
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
    if (!user) return

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
      if (!activityId || !user || user.role !== UserRole.CLIENT) return

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
    if (!user || !selectedActivity || activityId !== selectedActivity.id) return false

    const isEnrolled = selectedActivity.participants.some((participant) => participant.userId === user.id)
    const isCompletedOrPast =
      selectedActivity.status === ActivityStatus.COMPLETED || new Date(selectedActivity.date) < new Date()

    return isEnrolled && isCompletedOrPast && selectedActivity.status !== ActivityStatus.CANCELLED
  }, [activityId, selectedActivity, user])

  const selectedMuscleGroupLabels = useMemo(() => {
    if (summaryForm.muscleGroups.length === 0) return "Seleccionar grupo muscular"

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!activityId) return

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

  return {
    user,
    router,
    activityId,
    selectedActivity,
    isLoadingData,
    hasExistingSummary,
    isMuscleGroupComboboxOpen,
    setIsMuscleGroupComboboxOpen,
    summaryForm,
    setSummaryForm,
    canSubmitSummary,
    selectedMuscleGroupLabels,
    isSavingSummary,
    toggleMuscleGroup,
    handleSubmit,
  }
}
