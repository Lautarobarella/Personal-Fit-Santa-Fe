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
public class ActivityDetailInfoDTO {
    private Long id;
    private String name;
    private String description;
    private String location;
    private Long trainerId;
    private String trainerName;
    private LocalDateTime date;
    private Integer duration;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private List<ActivityUserDetailDTO> participants;
    private ActivityStatus status;
    private String createdBy;
    private String lastModifiedBy;
    private LocalDateTime createdAt;
    private LocalDateTime lastModified;
    private String notes;
    
    // Fields for recurring activities
    private Boolean isRecurring;
    private List<Boolean> weeklySchedule;
}
