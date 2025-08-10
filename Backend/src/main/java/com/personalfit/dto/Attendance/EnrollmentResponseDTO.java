package com.personalfit.dto.Attendance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentResponseDTO {
    private Boolean success;
    private String message;
    private AttendanceDTO enrollment;
} 