package com.personalfit.dto.Notification;

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkNotificationRequest {

    @NotEmpty(message = "User IDs list cannot be empty")
    private List<Long> userIds;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Body is required")
    private String body;

    private String type; // class_reminder, payment_due, new_class, etc.

    private String image; // Optional image URL

    private Map<String, String> data; // Additional data for the notification

    private Boolean saveToDatabase; // Whether to save these notifications in the database
}