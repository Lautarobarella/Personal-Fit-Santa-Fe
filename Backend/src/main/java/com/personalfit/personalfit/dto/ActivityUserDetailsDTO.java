package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.utils.ActivityStatus;
import com.personalfit.personalfit.utils.AttendanceStatus;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Data
@Builder
public class ActivityUserDetailsDTO {

    private Long id;
    private String name;
    private String trainerName;
    private LocalDateTime date;
    private ActivityStatus activityStatus;
    private AttendanceStatus clientStatus;

}
