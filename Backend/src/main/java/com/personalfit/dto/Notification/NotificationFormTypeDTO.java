package com.personalfit.dto.Notification;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationFormTypeDTO {
    private String title;
    private String message;
    private String userId; // Parsear a Long
}
