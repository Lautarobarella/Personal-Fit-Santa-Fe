package com.personalfit.dto.Activity;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainerActivityDTO {
    private Long id;
    private String name;
    private LocalDateTime date;
    private Integer duration;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private String status;
}
