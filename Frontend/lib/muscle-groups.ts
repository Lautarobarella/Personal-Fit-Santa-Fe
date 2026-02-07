import { MuscleGroup } from "@/lib/types"

export const MUSCLE_GROUP_OPTIONS: Array<{ value: MuscleGroup; label: string }> = [
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

const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = MUSCLE_GROUP_OPTIONS.reduce(
  (labels, option) => {
    labels[option.value] = option.label
    return labels
  },
  {} as Record<MuscleGroup, string>,
)

export const getMuscleGroupLabel = (muscleGroup: MuscleGroup): string => {
  return MUSCLE_GROUP_LABELS[muscleGroup] ?? muscleGroup
}

export const getMuscleGroupLabels = (muscleGroups?: MuscleGroup[] | null): string[] => {
  if (!muscleGroups || muscleGroups.length === 0) {
    return []
  }

  return muscleGroups.map(getMuscleGroupLabel)
}
