package com.personalfit.tasks;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.personalfit.enums.ActivityStatus;
import com.personalfit.enums.NotificationStatus;
import com.personalfit.models.Activity;
import com.personalfit.models.Notification;
import com.personalfit.repository.ActivityRepository;
import com.personalfit.repository.NotificationRepository;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ActivityReminderTask {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // Run every 15 minutes
    @Scheduled(cron = "0 */15 * * * *")
    public void sendActivityReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneHourLater = now.plusMinutes(60);
        LocalDateTime oneHourFifteenLater = now.plusMinutes(75);

        // Find activities starting between 60 and 75 minutes from now
        List<Activity> upcomingActivities = activityRepository.findByDateBetween(oneHourLater, oneHourFifteenLater);

        for (Activity activity : upcomingActivities) {
            if (activity.getStatus() != ActivityStatus.CANCELLED) {
                // Notify Trainer
                if (activity.getTrainer() != null) {
                    // Check if notification already exists to avoid duplicates (optional but good
                    // practice)
                    // For simplicity, we assume the window and cron schedule prevents most
                    // duplicates

                    Notification notification = new Notification();
                    notification.setTitle("Recordatorio de Clase");
                    notification.setMessage("Tu clase '" + activity.getName() + "' comienza en 1 hora.");
                    notification.setStatus(NotificationStatus.UNREAD);
                    notification.setCreatedAt(LocalDateTime.now());
                    notification.setUser(activity.getTrainer());

                    notificationRepository.save(notification);
                    log.info("Reminder sent to trainer {} for activity {}", activity.getTrainer().getEmail(),
                            activity.getName());
                }
            }
        }
    }
}
