package com.personalfit.services;

import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.personalfit.models.User;
import com.personalfit.repository.UserRepository;

/**
 * Servicio para ejecutar tareas programadas relacionadas con notificaciones push
 */
@Service
public class NotificationSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationSchedulerService.class);

    @Autowired
    private NotificationTriggerService triggerService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Ejecuta cada hora para enviar recordatorios de clases próximas
     * Se ejecuta a los minutos 0 de cada hora
     */
    @Scheduled(cron = "0 0 * * * *")
    public void sendClassReminders() {
        try {
            logger.info("Starting class reminders job");
            LocalDateTime oneHourFromNow = LocalDateTime.now().plusHours(1);
            
            // TODO: Implementar lógica para obtener clases programadas en la próxima hora
            // List<Activity> upcomingActivities = activityRepository.findActivitiesInTimeWindow(oneHourFromNow.minusMinutes(30), oneHourFromNow.plusMinutes(30));
            
            // for (Activity activity : upcomingActivities) {
            //     List<User> enrolledUsers = activity.getEnrolledUsers();
            //     for (User user : enrolledUsers) {
            //         triggerService.sendClassReminder(user, activity.getName(), activity.getStartTime(), activity.getLocation());
            //     }
            // }
            
            logger.info("Class reminders job completed");
        } catch (Exception e) {
            logger.error("Error in class reminders job", e);
        }
    }

    /**
     * Ejecuta diariamente a las 9:00 AM para enviar recordatorios de pagos próximos a vencer
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendPaymentReminders() {
        try {
            logger.info("Starting payment reminders job");
            LocalDateTime threeDaysFromNow = LocalDateTime.now().plusDays(3);
            
            // TODO: Implementar lógica para obtener pagos próximos a vencer
            // List<Payment> upcomingPayments = paymentRepository.findPaymentsDueBetween(LocalDateTime.now(), threeDaysFromNow);
            
            // for (Payment payment : upcomingPayments) {
            //     triggerService.sendPaymentDueReminder(payment.getUser(), payment.getAmount(), payment.getDueDate());
            // }
            
            logger.info("Payment reminders job completed");
        } catch (Exception e) {
            logger.error("Error in payment reminders job", e);
        }
    }

    /**
     * Ejecuta diariamente a las 8:00 PM para enviar recordatorios de muchas inasistencias
     */
    @Scheduled(cron = "0 0 20 * * *")
    public void sendAttendanceReminders() {
        try {
            logger.info("Starting attendance reminders job");
            LocalDateTime today = LocalDateTime.now();
            LocalDateTime startOfDay = today.toLocalDate().atStartOfDay();
            
            // TODO: Implementar lógica para obtener usuarios que asistieron a clases hoy pero no marcaron asistencia
            // List<Activity> todaysActivities = activityRepository.findActivitiesBetween(startOfDay, today);
            
            // for (Activity activity : todaysActivities) {
            //     List<User> attendeesWithoutCheckIn = activity.getAttendeesWithoutCheckIn();
            //     for (User user : attendeesWithoutCheckIn) {
            //         triggerService.sendAttendanceReminder(user, activity.getName(), activity.getStartTime());
            //     }
            // }
            
            logger.info("Attendance reminders job completed");
        } catch (Exception e) {
            logger.error("Error in attendance reminders job", e);
        }
    }

    /**
     * Ejecuta el primer día de cada mes para enviar notificaciones de promociones mensuales
     */
/*     @Scheduled(cron = "0 0 10 1 * *")
    public void sendMonthlyPromotions() {
        try {
            logger.info("Starting monthly promotions job");
            
            // TODO: Implementar lógica para obtener promociones activas del mes
            // List<Promotion> monthlyPromotions = promotionRepository.findActivePromotionsForMonth();
            // List<User> subscribedUsers = userRepository.findUsersSubscribedToPromotions();
            
            // for (Promotion promo : monthlyPromotions) {
            //     triggerService.sendPromotion(subscribedUsers, promo.getTitle(), promo.getDescription(), 
            //                                 promo.getCode(), promo.getExpiryDate());
            // }
            
            logger.info("Monthly promotions job completed");
        } catch (Exception e) {
            logger.error("Error in monthly promotions job", e);
        }
    } */

    /**
     * Limpia tokens de dispositivos inactivos cada semana (domingos a las 2:00 AM)
     */
    @Scheduled(cron = "0 0 2 * * SUN")
    public void cleanupInactiveTokens() {
        try {
            logger.info("Starting inactive tokens cleanup job");
            
            // TODO: Implementar limpieza de tokens que no se han usado en 30 días
            // LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
            // List<UserDeviceToken> inactiveTokens = deviceTokenRepository.findInactiveTokens(cutoffDate);
            
            // for (UserDeviceToken token : inactiveTokens) {
            //     deviceTokenRepository.delete(token);
            // }
            
            // logger.info("Cleanup completed. Removed {} inactive tokens", inactiveTokens.size());
        } catch (Exception e) {
            logger.error("Error in inactive tokens cleanup job", e);
        }
    }

    /**
     * Método manual para enviar notificación de meta alcanzada
     * Este método debe ser llamado desde el servicio correspondiente cuando se detecte una meta cumplida
     */
    public void scheduleGoalAchievementNotification(User user, String goalType, String achievement) {
        try {
            triggerService.sendGoalAchievement(user, goalType, achievement);
            logger.info("Goal achievement notification scheduled for user: {}", user.getId());
        } catch (Exception e) {
            logger.error("Error scheduling goal achievement notification for user: " + user.getId(), e);
        }
    }
}