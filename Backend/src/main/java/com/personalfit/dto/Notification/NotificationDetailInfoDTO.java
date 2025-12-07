package com.personalfit.dto.Notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.personalfit.enums.NotificationStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDetailInfoDTO {
    private Long id;
    private String title;
    private String message;
    private LocalDateTime createdAt;
    private NotificationStatus status;
    private Long userId;
    private String userName;
}
