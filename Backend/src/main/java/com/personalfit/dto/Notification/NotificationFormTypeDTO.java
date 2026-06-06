package com.personalfit.dto.Notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationFormTypeDTO {
    private String title;
    private String message;
    private String userId; // Parsear a Long
}
