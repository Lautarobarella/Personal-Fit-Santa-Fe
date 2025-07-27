package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.utils.ActivityStatus;
import com.personalfit.personalfit.utils.AttendanceStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserActivityDetailsDTO {

    private Long id;
    private String name;
    private String trainerName;
    private LocalDateTime date;
    private ActivityStatus activityStatus;
    private AttendanceStatus clientStatus;

}
