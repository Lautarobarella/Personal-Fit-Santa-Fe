package com.personalfit.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.personalfit.dto.Notification.NotificationDTO;
import com.personalfit.enums.NotificationStatus;
import com.personalfit.enums.UserRole;
import com.personalfit.models.Notification;
import com.personalfit.models.User;
import com.personalfit.repository.NotificationRepository;
import com.personalfit.repository.UserRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    public List<NotificationDTO> getAllByUserId(Long id) {
        try {
            List<Notification> notifications = notificationRepository.findByUserId(id);
            
            if (notifications == null || notifications.isEmpty()) {
                return new ArrayList<>();
            }

            return notifications.stream().map(n -> {
                return NotificationDTO.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .date(n.getDate())
                        .status(n.getStatus())
                        .targetRole(n.getTargetRole())
                        .infoType("INFO") // Valor por defecto
                        .notificationCategory("CLIENT") // Valor por defecto
                        .build();
            }).collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error fetching notifications for user " + id + ": " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<NotificationDTO> getUserNotificationsByIdAndEmail(Long userId, String userEmail) {
        try {
            // Verificar que el usuario corresponde al email autenticado
            Optional<User> user = userRepository.findByEmail(userEmail);
            if (user.isEmpty()) {
                System.err.println("User not found with email: " + userEmail);
                return new ArrayList<>();
            }
            
            // Verificar que el ID del usuario coincide con el solicitado
            if (!user.get().getId().equals(userId)) {
                System.err.println("User ID mismatch. Requested: " + userId + ", Found: " + user.get().getId());
                return new ArrayList<>();
            }
            
            // Si la validación es exitosa, obtener las notificaciones
            return getAllByUserId(userId);
        } catch (Exception e) {
            System.err.println("Error fetching notifications for user with email " + userEmail + ": " + e.getMessage());
            return new ArrayList<>();
        }
    }

    @Transactional
    public boolean updateNotificationStatus(Long notificationId, NotificationStatus status) {
        try {
            Optional<Notification> optionalNotification = notificationRepository.findById(notificationId);
            if (optionalNotification.isPresent()) {
                Notification notification = optionalNotification.get();
                notification.setStatus(status);
                notificationRepository.save(notification);
                return true;
            }
            return false;
        } catch (Exception e) {
            System.err.println("Error updating notification status: " + e.getMessage());
            return false;
        }
    }

    @Transactional
    public boolean deleteNotification(Long notificationId) {
        try {
            if (notificationRepository.existsById(notificationId)) {
                notificationRepository.deleteById(notificationId);
                return true;
            }
            return false;
        } catch (Exception e) {
            System.err.println("Error deleting notification: " + e.getMessage());
            return false;
        }
    }

    @Transactional
    public void markAllAsReadByUserId(Long userId) {
        try {
            List<Notification> unreadNotifications = notificationRepository.findByUserIdAndStatus(userId, NotificationStatus.UNREAD);
            unreadNotifications.forEach(notification -> notification.setStatus(NotificationStatus.READ));
            notificationRepository.saveAll(unreadNotifications);
        } catch (Exception e) {
            System.err.println("Error marking all notifications as read: " + e.getMessage());
        }
    }

    @Transactional
    public void createPaymentExpiredNotification(List<User> users, List<User> admins) {
        List<Notification> notifications = new ArrayList<>();

        for (User user : users) {
            Notification notification = Notification.builder()
                    .title("Pago vencido")
                    .message("Tu pago está vencido. Por favor, realiza el pago lo antes posible.")
                    .user(user)
                    .date(LocalDateTime.now())
                    .status(NotificationStatus.UNREAD)
                    .targetRole(UserRole.CLIENT)
                    .build();
            notifications.add(notification);
        }

        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void createBirthdayNotification(List<User> users, List<User> admins) {
        List<Notification> notifications = new ArrayList<>();

        for (User user : users) {
            for (User admin : admins) {
                Notification notification = Notification.builder()
                        .title("Cumple de " + user.getFirstName())
                        .message("Hoy es el cumpleaños de " + user.getFullName() + "! Deseale un feliz cumpleaños!")
                        .user(admin)
                        .date(LocalDateTime.now())
                        .status(NotificationStatus.UNREAD)
                        .targetRole(UserRole.ADMIN)
                        .build();
                notifications.add(notification);
            }
        }

        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void createAttendanceWarningNotification(List<User> users, List<User> admins) {
        List<Notification> notifications = new ArrayList<>();

        for (User user : users) {
            for (User admin : admins) {
                Notification notification = Notification.builder()
                        .title("Inasistencia de " + user.getFirstName())
                        .message(user.getFullName() + " hace 4 días que no asiste al gimnasio. Contactalo para saber si necesita ayuda.")
                        .user(admin)
                        .date(LocalDateTime.now())
                        .status(NotificationStatus.UNREAD)
                        .targetRole(UserRole.ADMIN)
                        .build();
                notifications.add(notification);
            }
        }

        notificationRepository.saveAll(notifications);
    }
}
