package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.utils.ActivityStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityTypeDTO {
    private Long id;
    private String name;
    private String description;
    private String location;
    private String trainerName;
    private LocalDateTime date;
    private Integer duration;
    private List<Long> participants;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private ActivityStatus status;
    
    // Fields for recurring activities
    private Boolean isRecurring;
    private List<Boolean> weeklySchedule;
}
