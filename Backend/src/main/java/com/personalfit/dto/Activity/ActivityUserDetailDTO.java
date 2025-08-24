package com.personalfit.dto.Activity;

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
public class ActivityUserDetailDTO {
    private Long id; 
    private Long userId;
    private String firstName;
    private String lastName;
    private LocalDateTime createdAt;
    private AttendanceStatus status;
}
