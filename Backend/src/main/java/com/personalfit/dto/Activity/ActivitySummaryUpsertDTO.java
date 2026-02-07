package com.personalfit.dto.Activity;

import java.util.List;

import com.personalfit.enums.MuscleGroup;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ActivitySummaryUpsertDTO {

    private List<MuscleGroup> muscleGroups;

    // Backward compatibility with older clients that still send a single group.
    private MuscleGroup muscleGroup;

    @AssertTrue(message = "At least one muscle group is required")
    public boolean hasAtLeastOneMuscleGroup() {
        return (muscleGroups != null && !muscleGroups.isEmpty()) || muscleGroup != null;
    }

    public List<MuscleGroup> resolveMuscleGroups() {
        if (muscleGroups != null && !muscleGroups.isEmpty()) {
            return muscleGroups;
        }

        if (muscleGroup != null) {
            return List.of(muscleGroup);
        }

        return List.of();
    }

    @NotNull(message = "Effort level is required")
    @Min(value = 1, message = "Effort level must be between 1 and 10")
    @Max(value = 10, message = "Effort level must be between 1 and 10")
    private Integer effortLevel;

    @NotBlank(message = "Training description is required")
    @Size(max = 2500, message = "Training description must not exceed 2500 characters")
    private String trainingDescription;
}
