package com.personalfit.dto.Notification;

import java.time.LocalDateTime;

import com.personalfit.enums.NotificationStatus;
import com.personalfit.enums.UserRole;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationDTO {
    private Long id;
    private String title;
    private String message;
    private LocalDateTime date;
    private NotificationStatus status;
    private UserRole targetRole;
    private String infoType; // Para compatibilidad con frontend
    private String notificationCategory; // Para compatibilidad con frontend
}
