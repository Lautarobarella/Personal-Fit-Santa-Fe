package com.personalfit.personalfit.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationDTO {
    private Long id;
    private String title;
    private String message;
    private LocalDateTime date;
}
