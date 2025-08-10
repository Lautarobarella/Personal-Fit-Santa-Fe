package com.personalfit.dto.Attendance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.personalfit.enums.AttendanceStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceDTO {
    private Long id;
    private Long activityId;
    private Long userId;
    private AttendanceStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 