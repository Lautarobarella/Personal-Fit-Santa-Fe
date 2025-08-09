package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.utils.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityUserDetailDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private LocalDateTime createdAt;
    private AttendanceStatus status;
}
