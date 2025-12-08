package com.personalfit.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import com.personalfit.dto.Notification.NotificationDetailInfoDTO;
import com.personalfit.dto.Notification.NotificationFormTypeDTO;
import com.personalfit.dto.Notification.NotificationTypeDTO;
import com.personalfit.enums.NotificationStatus;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.models.Notification;
import com.personalfit.models.User;
import com.personalfit.repository.NotificationRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    @Lazy
    private UserService userService;

    @Autowired
    private FCMService fcmService;

    /**
     * Crea una notificación para un usuario específico
     */
    public void createNotification(NotificationFormTypeDTO notification) {
        User user = userService.getUserById(Long.parseLong(notification.getUserId()));

        Notification newNotification = Notification.builder()
                .title(notification.getTitle())
                .message(notification.getMessage())
                .user(user)
                .status(NotificationStatus.UNREAD)
                .createdAt(LocalDateTime.now())
                .build();

        try {
            notificationRepository.save(newNotification);
            log.info("✅ Notification created for user: {} | Title: {}", user.getId(), notification.getTitle());

            // Send Push Notification
            fcmService.sendNotification(user.getId(), notification.getTitle(), notification.getMessage());

        } catch (Exception e) {
            throw new BusinessRuleException("Error al guardar la notificación: " + e.getMessage(),
                    "Api/Notification/createNotification");
        }
    }

    /**
     * Crea notificaciones masivas para todos los usuarios (excepto admins)
     * Usado por el admin para enviar notificaciones generales desde /settings
     */
    public int createBulkNotification(String title, String message) {
        try {
            // Obtener todos los usuarios que NO son ADMIN
            List<User> allUsers = userService.getAllNonAdminUsers();

            if (allUsers.isEmpty()) {
                log.warn("⚠️ No hay usuarios no-admin para enviar notificaciones");
                return 0;
            }

            LocalDateTime now = LocalDateTime.now();
            int count = 0;

            for (User user : allUsers) {
                Notification notification = Notification.builder()
                        .title(title)
                        .message(message)
                        .user(user)
                        .status(NotificationStatus.UNREAD)
                        .createdAt(now)
                        .build();

                notificationRepository.save(notification);

                // Send Push Notification
                fcmService.sendNotification(user.getId(), title, message);

                count++;
            }

            log.info("✅ Bulk notifications created: {} | Title: '{}' | Recipients: {}", count, title, count);
            return count;

        } catch (Exception e) {
            log.error("❌ Error al crear notificaciones masivas: {}", e.getMessage());
            throw new BusinessRuleException("Error al crear notificaciones masivas: " + e.getMessage(),
                    "Api/Notification/createBulkNotification");
        }
    }

    public void deleteNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notificación con ID: " + id + " no encontrada",
                        "Api/Notification/deleteNotification"));

        try {
            notificationRepository.delete(notification);
            log.info("✅ Notification deleted: {}", id);
        } catch (Exception e) {
            throw new BusinessRuleException("Error al eliminar la notificación: " + e.getMessage(),
                    "Api/Notification/deleteNotification");
        }
    }

    public List<NotificationTypeDTO> getAllNotificationsTypeDto(Long userId) {
        User user = userService.getUserById(userId);
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        return notifications.stream()
                .map(this::convertToNotificationTypeDTO)
                .collect(Collectors.toList());
    }

    public NotificationDetailInfoDTO getNotificationDetailInfo(Long id) {
        Optional<Notification> notification = notificationRepository.findById(id);
        if (notification.isEmpty()) {
            throw new EntityNotFoundException("Notificación con ID: " + id + " no encontrada",
                    "Api/Notification/getNotificationDetailInfo");
        }

        Notification notif = notification.get();
        return NotificationDetailInfoDTO.builder()
                .id(notif.getId())
                .title(notif.getTitle())
                .message(notif.getMessage())
                .createdAt(notif.getCreatedAt())
                .status(notif.getStatus())
                .userId(notif.getUser().getId())
                .userName(notif.getUser().getFullName())
                .build();
    }

    public void markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notificación con ID: " + id + " no encontrada",
                        "Api/Notification/markAsRead"));

        notification.setStatus(NotificationStatus.READ);

        try {
            notificationRepository.save(notification);
            log.info("✅ Notification marked as read: {}", id);
        } catch (Exception e) {
            throw new BusinessRuleException("Error al marcar la notificación como leída: " + e.getMessage(),
                    "Api/Notification/markAsRead");
        }
    }

    public void markAsUnread(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notificación con ID: " + id + " no encontrada",
                        "Api/Notification/markAsUnread"));

        notification.setStatus(NotificationStatus.UNREAD);

        try {
            notificationRepository.save(notification);
            log.info("✅ Notification marked as unread: {}", id);
        } catch (Exception e) {
            throw new BusinessRuleException("Error al marcar la notificación como no leída: " + e.getMessage(),
                    "Api/Notification/markAsUnread");
        }
    }

    public void archiveNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notificación con ID: " + id + " no encontrada",
                        "Api/Notification/archiveNotification"));

        notification.setStatus(NotificationStatus.ARCHIVED);

        try {
            notificationRepository.save(notification);
            log.info("✅ Notification archived: {}", id);
        } catch (Exception e) {
            throw new BusinessRuleException("Error al archivar la notificación: " + e.getMessage(),
                    "Api/Notification/archiveNotification");
        }
    }

    public void unarchiveNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notificación con ID: " + id + " no encontrada",
                        "Api/Notification/unarchiveNotification"));

        notification.setStatus(NotificationStatus.READ);

        try {
            notificationRepository.save(notification);
            log.info("✅ Notification unarchived: {}", id);
        } catch (Exception e) {
            throw new BusinessRuleException("Error al desarchivar la notificación: " + e.getMessage(),
                    "Api/Notification/unarchiveNotification");
        }
    }

    // ===============================
    // MÉTODOS PARA NOTIFICACIONES AUTOMÁTICAS DEL SISTEMA
    // ===============================

    /**
     * Crea notificaciones de pago vencido para usuarios
     */
    public void createPaymentExpiredNotification(List<User> users, List<User> admins) {
        LocalDateTime now = LocalDateTime.now();

        for (User user : users) {
            try {
                String title = "Pago Vencido";
                String message = "Tu membresía ha vencido. Por favor, realiza el pago para continuar usando los servicios.";

                Notification notification = Notification.builder()
                        .title(title)
                        .message(message)
                        .user(user)
                        .status(NotificationStatus.UNREAD)
                        .createdAt(now)
                        .build();

                notificationRepository.save(notification);

                // Send Push Notification
                fcmService.sendNotification(user.getId(), title, message);

                log.info("✅ Payment expired notification created for user: {}", user.getId());
            } catch (Exception e) {
                log.error("Error creating payment expired notification for user {}: {}", user.getId(), e.getMessage());
            }
        }

        // Notificar a admins si hay usuarios con pagos vencidos
        if (!users.isEmpty() && !admins.isEmpty()) {
            for (User admin : admins) {
                try {
                    String title = "Pagos Vencidos";
                    String message = users.size() + " usuario(s) tienen pagos vencidos hoy.";

                    Notification notification = Notification.builder()
                            .title(title)
                            .message(message)
                            .user(admin)
                            .status(NotificationStatus.UNREAD)
                            .createdAt(now)
                            .build();

                    notificationRepository.save(notification);

                    // Send Push Notification
                    fcmService.sendNotification(admin.getId(), title, message);

                    log.info("✅ Payment expired notification created for admin: {}", admin.getId());
                } catch (Exception e) {
                    log.error("Error creating payment expired notification for admin {}: {}", admin.getId(),
                            e.getMessage());
                }
            }
        }
    }

    /**
     * Crea notificaciones de cumpleaños
     */
    public void createBirthdayNotification(List<User> users, List<User> admins) {
        LocalDateTime now = LocalDateTime.now();

        for (User user : users) {
            try {
                String title = "¡Feliz Cumpleaños!";
                String message = "¡Feliz cumpleaños " + user.getFirstName() + "! Te deseamos un excelente día. 🎉";

                Notification notification = Notification.builder()
                        .title(title)
                        .message(message)
                        .user(user)
                        .status(NotificationStatus.UNREAD)
                        .createdAt(now)
                        .build();

                notificationRepository.save(notification);

                // Send Push Notification
                fcmService.sendNotification(user.getId(), title, message);

                log.info("✅ Birthday notification created for user: {}", user.getId());
            } catch (Exception e) {
                log.error("Error creating birthday notification for user {}: {}", user.getId(), e.getMessage());
            }
        }

        // Notificar a admins sobre cumpleaños
        if (!users.isEmpty() && !admins.isEmpty()) {
            for (User admin : admins) {
                try {
                    String userNames = users.stream()
                            .map(User::getFullName)
                            .collect(Collectors.joining(", "));

                    String title = "Cumpleaños Hoy";
                    String message = "Hoy cumplen años: " + userNames;

                    Notification notification = Notification.builder()
                            .title(title)
                            .message(message)
                            .user(admin)
                            .status(NotificationStatus.UNREAD)
                            .createdAt(now)
                            .build();

                    notificationRepository.save(notification);

                    // Send Push Notification
                    fcmService.sendNotification(admin.getId(), title, message);

                    log.info("✅ Birthday notification created for admin: {}", admin.getId());
                } catch (Exception e) {
                    log.error("Error creating birthday notification for admin {}: {}", admin.getId(), e.getMessage());
                }
            }
        }
    }

    /**
     * Crea notificaciones de advertencia de asistencia
     */
    public void createAttendanceWarningNotification(List<User> users, List<User> admins) {
        LocalDateTime now = LocalDateTime.now();

        for (User user : users) {
            try {
                String title = "Advertencia de Inasistencia";
                String message = "Hace más de 7 días que no asistes a clases. ¡Te esperamos!";

                Notification notification = Notification.builder()
                        .title(title)
                        .message(message)
                        .user(user)
                        .status(NotificationStatus.UNREAD)
                        .createdAt(now)
                        .build();

                notificationRepository.save(notification);

                // Send Push Notification
                fcmService.sendNotification(user.getId(), title, message);

                log.info("✅ Attendance warning notification created for user: {}", user.getId());
            } catch (Exception e) {
                log.error("Error creating attendance warning notification for user {}: {}", user.getId(),
                        e.getMessage());
            }
        }

        // Notificar a admins sobre usuarios con inasistencias
        if (!users.isEmpty() && !admins.isEmpty()) {
            for (User admin : admins) {
                try {
                    String title = "Usuarios con Inasistencias";
                    String message = users.size() + " usuario(s) llevan más de 7 días sin asistir.";

                    Notification notification = Notification.builder()
                            .title(title)
                            .message(message)
                            .user(admin)
                            .status(NotificationStatus.UNREAD)
                            .createdAt(now)
                            .build();

                    notificationRepository.save(notification);

                    // Send Push Notification
                    fcmService.sendNotification(admin.getId(), title, message);

                    log.info("✅ Attendance warning notification created for admin: {}", admin.getId());
                } catch (Exception e) {
                    log.error("Error creating attendance warning notification for admin {}: {}", admin.getId(),
                            e.getMessage());
                }
            }
        }
    }

    /**
     * Envía recordatorio de pago próximo a vencer
     */
    public void sendPaymentDueReminder(User user, Double amount, LocalDate expiresAt) {
        try {
            long daysUntilExpiration = java.time.temporal.ChronoUnit.DAYS.between(
                    LocalDate.now(), expiresAt);

            String title = "Recordatorio de Pago";
            String message = "Tu membresía vence en " + daysUntilExpiration + " día(s). Monto: $" + amount;

            Notification notification = Notification.builder()
                    .title(title)
                    .message(message)
                    .user(user)
                    .status(NotificationStatus.UNREAD)
                    .createdAt(LocalDateTime.now())
                    .build();

            notificationRepository.save(notification);

            // Send Push Notification
            fcmService.sendNotification(user.getId(), title, message);

            log.info("✅ Payment due reminder created for user: {}", user.getId());
        } catch (Exception e) {
            log.error("Error creating payment due reminder for user {}: {}", user.getId(), e.getMessage());
        }
    }

    /**
     * Envía recordatorio de clase en lote a múltiples usuarios
     */
    public void sendBulkClassReminder(List<User> users, String activityName,
            LocalDateTime activityDate, String location) {
        LocalDateTime now = LocalDateTime.now();

        for (User user : users) {
            try {
                String title = "Recordatorio de Clase";
                String message = "Tienes la clase '" + activityName + "' próximamente en " + location + ".";

                Notification notification = Notification.builder()
                        .title(title)
                        .message(message)
                        .user(user)
                        .status(NotificationStatus.UNREAD)
                        .createdAt(now)
                        .build();

                notificationRepository.save(notification);

                // Send Push Notification
                fcmService.sendNotification(user.getId(), title, message);

                log.info("✅ Class reminder created for user: {} for activity: {}", user.getId(), activityName);
            } catch (Exception e) {
                log.error("Error creating class reminder for user {}: {}", user.getId(), e.getMessage());
            }
        }
    }

    // Métodos de utilidad

    private NotificationTypeDTO convertToNotificationTypeDTO(Notification notification) {
        return NotificationTypeDTO.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .createdAt(notification.getCreatedAt())
                .status(notification.getStatus())
                .userId(notification.getUser().getId())
                .userName(notification.getUser().getFullName())
                .build();
    }
}
