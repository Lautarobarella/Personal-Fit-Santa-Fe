package com.personalfit.dto.Notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferencesDTO {

    private Boolean classReminders;
    private Boolean paymentDue;
    private Boolean newClasses;
    private Boolean promotions;
    private Boolean classCancellations;
    private Boolean generalAnnouncements;
}