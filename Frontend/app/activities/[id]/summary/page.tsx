"use client"

import { useActivitySummary } from "@/hooks/activities/use-activity-summary"
import { UserRole } from "@/types"
import { getMuscleGroupLabel, MUSCLE_GROUP_OPTIONS } from "@/lib/muscle-groups"
import { cn } from "@/lib/utils"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

interface ActivitySummaryPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ActivitySummaryPage({ params }: ActivitySummaryPageProps) {
  const {
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
  } = useActivitySummary(params)

  if (!user || user.role !== UserRole.CLIENT) {
    return null
  }

  if (isLoadingData || !activityId || !selectedActivity || selectedActivity.id !== activityId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <MobileHeader title="Resumen de Actividad" showBack onBack={() => router.back()} />

      <div className="container-centered py-6 space-y-6">
        {/* Actividad */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <h3 className="text-base font-semibold">Actividad</h3>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-semibold">{selectedActivity.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Entrenador: {selectedActivity.trainerName}
            </p>
          </div>
        </section>

        {/* Resumen */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
            <h3 className="text-base font-semibold">
              {hasExistingSummary ? "Editar resumen" : "Indicar resumen"}
            </h3>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-6 rounded-xl border p-4">
              <div className="space-y-2">
                <Label>Grupo muscular trabajado</Label>
                <Popover open={isMuscleGroupComboboxOpen} onOpenChange={setIsMuscleGroupComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-controls="muscle-group-command-list"
                      aria-expanded={isMuscleGroupComboboxOpen}
                      className="w-full justify-between bg-transparent font-normal"
                    >
                      <span className="truncate text-left">{selectedMuscleGroupLabels}</span>
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar grupo muscular..." />
                      <CommandList id="muscle-group-command-list">
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
                                  "mr-2 size-4",
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
                <Label htmlFor="trainingDescription">Descripción del entrenamiento</Label>
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
                  placeholder="Contanos cómo fue el entrenamiento, ejercicios destacados o sensaciones."
                />
              </div>

              {!canSubmitSummary && (
                <p className="text-sm text-destructive">
                  Esta actividad aún no está habilitada para resumen o no estás inscripto.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 bg-transparent"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isSavingSummary || !canSubmitSummary}>
                {isSavingSummary && <Loader2 className="mr-2 size-4 animate-spin" />}
                {hasExistingSummary ? "Actualizar resumen" : "Guardar resumen"}
              </Button>
            </div>
          </form>
        </section>
      </div>

      <BottomNav />
    </div>
  )
}
