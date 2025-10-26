package com.personalfit.services.notifications.factory;

import com.personalfit.enums.NotificationStatus;
import com.personalfit.enums.UserRole;
import com.personalfit.models.Notification;
import com.personalfit.models.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Factory para crear diferentes tipos de notificaciones
 * Centraliza la lógica de creación de notificaciones específicas
 */
@Component
public class NotificationFactory {
    
    /**
     * Crea notificaciones de pago vencido para una lista de usuarios
     * @param users Usuarios con pagos vencidos
     * @return Lista de notificaciones creadas
     */
    public List<Notification> createPaymentExpiredNotifications(List<User> users) {
        List<Notification> notifications = new ArrayList<>();
        
        for (User user : users) {
            Notification notification = Notification.builder()
                    .title("Pago vencido")
                    .message("Tu pago ha vencido, realiza un pago para renovar tu membresía")
                    .user(user)
                    .date(LocalDateTime.now())
                    .status(NotificationStatus.UNREAD)
                    .targetRole(UserRole.CLIENT)
                    .build();
            notifications.add(notification);
        }
        
        return notifications;
    }
    
    /**
     * Crea notificaciones de cumpleaños para administradores
     * @param birthdayUsers Usuarios que cumplen años
     * @param admins Administradores que recibirán la notificación
     * @return Lista de notificaciones creadas
     */
    public List<Notification> createBirthdayNotifications(List<User> birthdayUsers, List<User> admins) {
        List<Notification> notifications = new ArrayList<>();
        
        for (User birthdayUser : birthdayUsers) {
            for (User admin : admins) {
                Notification notification = Notification.builder()
                        .title("Cumple de " + birthdayUser.getFirstName())
                        .message("Hoy es el cumpleaños de " + birthdayUser.getFullName() + "! Deséale un feliz cumpleaños!")
                        .user(admin)
                        .date(LocalDateTime.now())
                        .status(NotificationStatus.UNREAD)
                        .targetRole(UserRole.ADMIN)
                        .build();
                notifications.add(notification);
            }
        }
        
        return notifications;
    }
    
    /**
     * Crea notificaciones de advertencia por inasistencia
     * @param absentUsers Usuarios con inasistencias prolongadas
     * @param admins Administradores que recibirán la notificación
     * @return Lista de notificaciones creadas
     */
    public List<Notification> createAttendanceWarningNotifications(List<User> absentUsers, List<User> admins) {
        List<Notification> notifications = new ArrayList<>();
        
        for (User absentUser : absentUsers) {
            for (User admin : admins) {
                Notification notification = Notification.builder()
                        .title("Inasistencia de " + absentUser.getFirstName())
                        .message(absentUser.getFullName() +
                                " hace 4 días que no asiste al gimnasio. Contáctalo para saber si necesita ayuda.")
                        .user(admin)
                        .date(LocalDateTime.now())
                        .status(NotificationStatus.UNREAD)
                        .targetRole(UserRole.ADMIN)
                        .build();
                notifications.add(notification);
            }
        }
        
        return notifications;
    }
    
    /**
     * Crea una notificación de recordatorio de pago
     * @param user Usuario que debe pagar
     * @param amount Monto del pago
     * @param dueDate Fecha de vencimiento
     * @return Notificación creada
     */
    public Notification createPaymentDueReminderNotification(User user, double amount, LocalDateTime dueDate) {
        return Notification.builder()
                .title("💳 Recordatorio de Pago")
                .message(String.format("Tu pago de $%.2f vence el %s. ¡No olvides pagarlo a tiempo!",
                        amount, dueDate.toLocalDate()))
                .user(user)
                .date(LocalDateTime.now())
                .status(NotificationStatus.UNREAD)
                .targetRole(user.getRole())
                .build();
    }
    
    /**
     * Crea una notificación de confirmación de pago
     * @param user Usuario que realizó el pago
     * @param amount Monto del pago
     * @param paymentMethod Método de pago utilizado
     * @return Notificación creada
     */
    public Notification createPaymentConfirmationNotification(User user, double amount, String paymentMethod) {
        return Notification.builder()
                .title("✅ Pago Verificado")
                .message(String.format("¡Tu pago ha sido verificado con éxito de $%.2f via %s!",
                        amount, paymentMethod))
                .user(user)
                .date(LocalDateTime.now())
                .status(NotificationStatus.UNREAD)
                .targetRole(user.getRole())
                .build();
    }
    
    /**
     * Crea una notificación de recordatorio de clase
     * @param user Usuario inscrito en la clase
     * @param className Nombre de la clase
     * @param classTime Hora de la clase
     * @param location Ubicación de la clase
     * @return Notificación creada
     */
    public Notification createClassReminderNotification(User user, String className, LocalDateTime classTime, String location) {
        return Notification.builder()
                .title("🏃‍♀️ Recordatorio de Clase")
                .message(String.format("Tu clase de %s comienza en 1 hora (%s). Ubicación: %s",
                        className, classTime.toLocalTime(), location))
                .user(user)
                .date(LocalDateTime.now())
                .status(NotificationStatus.UNREAD)
                .targetRole(user.getRole())
                .build();
    }
    
    /**
     * Crea una notificación de meta alcanzada
     * @param user Usuario que alcanzó la meta
     * @param achievement Descripción del logro
     * @return Notificación creada
     */
    public Notification createGoalAchievementNotification(User user, String achievement) {
        return Notification.builder()
                .title("🏆 ¡Meta Alcanzada!")
                .message(String.format("¡Felicitaciones %s! Has alcanzado tu meta: %s. ¡Sigue así!",
                        user.getFirstName(), achievement))
                .user(user)
                .date(LocalDateTime.now())
                .status(NotificationStatus.UNREAD)
                .targetRole(user.getRole())
                .build();
    }
    
    /**
     * Crea una notificación general/anuncio
     * @param user Usuario que recibirá el anuncio
     * @param title Título del anuncio
     * @param message Mensaje del anuncio
     * @return Notificación creada
     */
    public Notification createGeneralAnnouncementNotification(User user, String title, String message) {
        return Notification.builder()
                .title("📢 " + title)
                .message(message)
                .user(user)
                .date(LocalDateTime.now())
                .status(NotificationStatus.UNREAD)
                .targetRole(user.getRole())
                .build();
    }
}