package com.personalfit.dto.Activity;

import com.personalfit.enums.MuscleGroup;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ActivitySummaryUpsertDTO {

    @NotNull(message = "Muscle group is required")
    private MuscleGroup muscleGroup;

    @NotNull(message = "Effort level is required")
    @Min(value = 1, message = "Effort level must be between 1 and 10")
    @Max(value = 10, message = "Effort level must be between 1 and 10")
    private Integer effortLevel;

    @NotBlank(message = "Training description is required")
    @Size(max = 2500, message = "Training description must not exceed 2500 characters")
    private String trainingDescription;
}
