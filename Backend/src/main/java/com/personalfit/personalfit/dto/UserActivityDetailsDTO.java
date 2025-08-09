package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.utils.ActivityStatus;
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
public class UserActivityDetailsDTO {

    private Long id;
    private String name;
    private String trainerName;
    private LocalDateTime date;
    private ActivityStatus activityStatus;
    private AttendanceStatus clientStatus;

}
