package com.personalfit.services;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.personalfit.dto.Notification.SendNotificationRequest;
import com.personalfit.models.User;

/**
 * Servicio para gestionar el envío automático de notificaciones push
 * basadas en eventos del sistema (pagos, clases, promociones, etc.)
 */
@Service
public class NotificationTriggerService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationTriggerService.class);

    @Autowired
    private PushNotificationService pushNotificationService;

    /**
     * Envía notificación de recordatorio de pago próximo a vencer
     */
    @Async
    public void sendPaymentDueReminder(User user, double amount, LocalDateTime dueDate) {
        try {
            SendNotificationRequest request = SendNotificationRequest.builder()
                .userId(user.getId())
                .title("💳 Recordatorio de Pago")
                .body(String.format("Tu pago de $%.2f vence el %s. ¡No olvides pagarlo a tiempo!", 
                      amount, dueDate.toLocalDate()))
                .type("payment_due")
                .saveToDatabase(true)
                .build();

            pushNotificationService.sendNotificationToUser(request);
            logger.info("Payment due reminder sent to user: {}", user.getId());
        } catch (Exception e) {
            logger.error("Error sending payment due reminder to user: " + user.getId(), e);
        }
    }

    /**
     * Envía notificación de confirmación de pago verificado
     */
    @Async
    public void sendPaymentConfirmation(User user, double amount, String paymentMethod) {
        try {
            SendNotificationRequest request = SendNotificationRequest.builder()
                .userId(user.getId())
                .title("✅ Pago Verificado")
                .body(String.format("¡Tu pago ha sido verificado con éxito de $%.2f via %s!", 
                      amount, paymentMethod))
                .type("payment_confirmation")
                .saveToDatabase(true)
                .build();

            pushNotificationService.sendNotificationToUser(request);
            logger.info("Payment confirmation sent to user: {}", user.getId());
        } catch (Exception e) {
            logger.error("Error sending payment confirmation to user: " + user.getId(), e);
        }
    }

    /**
     * Envía recordatorio de clase próxima (1 hora antes)
     */
    @Async
    public void sendClassReminder(User user, String className, LocalDateTime classTime, String location) {
        try {
            SendNotificationRequest request = SendNotificationRequest.builder()
                .userId(user.getId())
                .title("🏃‍♀️ Recordatorio de Clase")
                .body(String.format("Tu clase de %s comienza en 1 hora (%s). Ubicación: %s", 
                      className, classTime.toLocalTime(), location))
                .type("class_reminder")
                .saveToDatabase(true)
                .build();

            pushNotificationService.sendNotificationToUser(request);
            logger.info("Class reminder sent to user: {}", user.getId());
        } catch (Exception e) {
            logger.error("Error sending class reminder to user: " + user.getId(), e);
        }
    }

    /**
     * Envía notificación de nueva clase disponible
     */
    @Async
    public void sendNewClassAvailable(List<User> users, String className, LocalDateTime classTime, 
                                     String instructor, int spotsAvailable) {
        try {
            for (User user : users) {
                SendNotificationRequest request = SendNotificationRequest.builder()
                    .userId(user.getId())
                    .title("🆕 Nueva Clase Disponible")
                    .body(String.format("Nueva clase: %s con %s el %s. ¡%d cupos disponibles!", 
                          className, instructor, classTime.toLocalDate(), spotsAvailable))
                    .type("new_class")
                    .saveToDatabase(true)
                    .build();

                pushNotificationService.sendNotificationToUser(request);
            }
            logger.info("New class notification sent to {} users", users.size());
        } catch (Exception e) {
            logger.error("Error sending new class notifications", e);
        }
    }

    /**
     * Envía promoción o descuento especial
     */
    @Async
    public void sendPromotion(List<User> users, String promoTitle, String promoDescription, 
                             String promoCode, LocalDateTime expiryDate) {
        try {
            for (User user : users) {
                SendNotificationRequest request = SendNotificationRequest.builder()
                    .userId(user.getId())
                    .title("🎉 " + promoTitle)
                    .body(String.format("%s Código: %s. Válido hasta: %s", 
                          promoDescription, promoCode, expiryDate.toLocalDate()))
                    .type("promotion")
                    .saveToDatabase(true)
                    .build();

                pushNotificationService.sendNotificationToUser(request);
            }
            logger.info("Promotion notification sent to {} users", users.size());
        } catch (Exception e) {
            logger.error("Error sending promotion notifications", e);
        }
    }

    /**
     * Envía anuncio general a todos los usuarios
     */
    @Async
    public void sendGeneralAnnouncement(List<User> users, String title, String message) {
        try {
            for (User user : users) {
                SendNotificationRequest request = SendNotificationRequest.builder()
                    .userId(user.getId())
                    .title("📢 " + title)
                    .body(message)
                    .type("general")
                    .saveToDatabase(true)
                    .build();

                pushNotificationService.sendNotificationToUser(request);
            }
            logger.info("General announcement sent to {} users", users.size());
        } catch (Exception e) {
            logger.error("Error sending general announcement", e);
        }
    }

    /**
     * Envía bienvenida a nuevo usuario
     */
    @Async
    public void sendWelcomeNotification(User user) {
        try {
            SendNotificationRequest request = SendNotificationRequest.builder()
                .userId(user.getId())
                .title("🎯 ¡Bienvenido a Personal Fit!")
                .body("¡Hola " + user.getFirstName() + "! Estamos emocionados de tenerte con nosotros. ¡Comienza tu transformación hoy!")
                .type("welcome")
                .saveToDatabase(true)
                .build();

            pushNotificationService.sendNotificationToUser(request);
            logger.info("Welcome notification sent to user: {}", user.getId());
        } catch (Exception e) {
            logger.error("Error sending welcome notification to user: " + user.getId(), e);
        }
    }

    /**
     * Envía notificación de meta de entrenamiento alcanzada
     */
    @Async
    public void sendGoalAchievement(User user, String goalType, String achievement) {
        try {
            SendNotificationRequest request = SendNotificationRequest.builder()
                .userId(user.getId())
                .title("🏆 ¡Meta Alcanzada!")
                .body(String.format("¡Felicitaciones %s! Has alcanzado tu meta: %s. ¡Sigue así!", 
                      user.getFirstName(), achievement))
                .type("goal_achievement")
                .saveToDatabase(true)
                .build();

            pushNotificationService.sendNotificationToUser(request);
            logger.info("Goal achievement notification sent to user: {}", user.getId());
        } catch (Exception e) {
            logger.error("Error sending goal achievement notification to user: " + user.getId(), e);
        }
    }
}