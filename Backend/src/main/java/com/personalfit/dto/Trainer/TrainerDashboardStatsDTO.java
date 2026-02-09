package com.personalfit.dto.Trainer;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainerDashboardStatsDTO {
    private Integer classesToday;
    private String nextClassName;
    private LocalDateTime nextClassTime;
    private Double currentShiftHours;
    private Double weeklyHours;
    private Integer activeClients; // Optional
    private Double attendanceRate; // Optional
}
