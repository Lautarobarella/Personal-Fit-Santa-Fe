package com.personalfit.dto.Activity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.time.LocalDateTime;
import java.util.List;

import com.personalfit.enums.ActivityStatus;

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
    private List<Long> participantsWithSummary;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private ActivityStatus status;
    
    // Fields for recurring activities
    private Boolean isRecurring;
    private List<Boolean> weeklySchedule;
}
