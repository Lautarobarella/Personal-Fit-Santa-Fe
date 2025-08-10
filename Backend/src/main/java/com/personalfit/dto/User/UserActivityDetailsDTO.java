package com.personalfit.dto.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.personalfit.enums.ActivityStatus;
import com.personalfit.enums.AttendanceStatus;

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
