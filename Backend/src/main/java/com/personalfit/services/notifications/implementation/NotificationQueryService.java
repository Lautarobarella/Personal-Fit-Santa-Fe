package com.personalfit.services.notifications.implementation;

import com.personalfit.dto.Notification.NotificationDTO;
import com.personalfit.enums.NotificationStatus;
import com.personalfit.models.Notification;
import com.personalfit.models.User;
import com.personalfit.repository.NotificationRepository;
import com.personalfit.repository.UserRepository;
import com.personalfit.services.notifications.interfaces.INotificationQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de consultas de notificaciones
 * Responsable únicamente de operaciones de lectura
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationQueryService implements INotificationQueryService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    public List<NotificationDTO> getUserNotifications(Long userId) {
        try {
            List<Notification> notifications = notificationRepository.findByUserId(userId);

            if (notifications == null || notifications.isEmpty()) {
                return new ArrayList<>();
            }

            return notifications.stream()
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Error fetching notifications for user {}: {}", userId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<NotificationDTO> getUserNotificationsByIdAndEmail(Long userId, String userEmail) {
        try {
            // Verificar que el usuario corresponde al email autenticado
            Optional<User> user = userRepository.findByEmail(userEmail);
            if (user.isEmpty()) {
                log.warn("User not found with email: {}", userEmail);
                return new ArrayList<>();
            }

            // Verificar que el ID del usuario coincide con el solicitado
            if (!user.get().getId().equals(userId)) {
                log.warn("User ID mismatch. Requested: {}, Found: {}", userId, user.get().getId());
                return new ArrayList<>();
            }

            // Si la validación es exitosa, obtener las notificaciones
            return getUserNotifications(userId);
            
        } catch (Exception e) {
            log.error("Error fetching notifications for user with email {}: {}", userEmail, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<NotificationDTO> getNotificationsByStatus(Long userId, NotificationStatus status) {
        try {
            List<Notification> notifications = notificationRepository.findByUserIdAndStatus(userId, status);
            
            return notifications.stream()
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Error fetching notifications by status {} for user {}: {}", status, userId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    @Override
    public long getUnreadNotificationCount(Long userId) {
        try {
            return notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
        } catch (Exception e) {
            log.error("Error counting unread notifications for user {}: {}", userId, e.getMessage(), e);
            return 0;
        }
    }

    @Override
    public boolean notificationExists(Long notificationId) {
        try {
            return notificationRepository.existsById(notificationId);
        } catch (Exception e) {
            log.error("Error checking if notification exists {}: {}", notificationId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean isUserOwnerOfNotification(Long notificationId, Long userId) {
        try {
            Optional<Notification> notification = notificationRepository.findById(notificationId);
            return notification.isPresent() && 
                   notification.get().getUser() != null && 
                   notification.get().getUser().getId().equals(userId);
        } catch (Exception e) {
            log.error("Error checking notification ownership for notification {} and user {}: {}", 
                     notificationId, userId, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Mapea una entidad Notification a NotificationDTO
     * @param notification Entidad a mapear
     * @return DTO mapeado
     */
    private NotificationDTO mapToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .date(notification.getDate())
                .status(notification.getStatus())
                .targetRole(notification.getTargetRole())
                .infoType("INFO") // Valor por defecto
                .notificationCategory("CLIENT") // Valor por defecto
                .build();
    }
}