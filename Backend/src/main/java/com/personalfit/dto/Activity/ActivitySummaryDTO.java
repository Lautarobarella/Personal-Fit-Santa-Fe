package com.personalfit.dto.Activity;

import java.time.LocalDateTime;

import com.personalfit.enums.MuscleGroup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivitySummaryDTO {
    private Long id;
    private MuscleGroup muscleGroup;
    private Integer effortLevel;
    private String trainingDescription;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
