package com.personalfit.dto.Payment;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyRevenueDTO {
    private Long id;
    private Integer year;
    private Integer month;
    private String monthName;
    private Double totalRevenue;
    private Integer totalPayments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime archivedAt;
    private Boolean isCurrentMonth;
}
