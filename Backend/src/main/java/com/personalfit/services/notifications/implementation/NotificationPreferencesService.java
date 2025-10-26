package com.personalfit.services.notifications.implementation;

import com.personalfit.dto.Notification.NotificationPreferencesDTO;
import com.personalfit.models.NotificationPreferences;
import com.personalfit.models.User;
import com.personalfit.repository.NotificationPreferencesRepository;
import com.personalfit.repository.UserRepository;
import com.personalfit.services.notifications.interfaces.INotificationPreferencesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Implementación del servicio de preferencias de notificaciones
 * Responsable únicamente de la gestión de preferencias de usuario
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationPreferencesService implements INotificationPreferencesService {

    private final NotificationPreferencesRepository preferencesRepository;
    private final UserRepository userRepository;

    @Override
    public NotificationPreferencesDTO getUserPreferencesAsDTO(Long userId) {
        Optional<NotificationPreferences> prefsOpt = preferencesRepository.findByUserId(userId);

        if (prefsOpt.isPresent()) {
            NotificationPreferences prefs = prefsOpt.get();
            return mapToDTO(prefs);
        }

        // Crear preferencias por defecto si no existen
        createDefaultPreferencesIfNotExists(userId);
        return createDefaultPreferencesDTO();
    }

    @Override
    public NotificationPreferences getUserPreferences(Long userId) {
        Optional<NotificationPreferences> prefsOpt = preferencesRepository.findByUserId(userId);
        if (prefsOpt.isPresent()) {
            return prefsOpt.get();
        }

        // Si no existen, crear preferencias por defecto
        createDefaultPreferencesIfNotExists(userId);
        return preferencesRepository.findByUserId(userId).orElse(null);
    }

    @Override
    @Transactional
    public boolean updateUserPreferences(Long userId, NotificationPreferencesDTO preferencesDTO) {
        try {
            Optional<NotificationPreferences> prefsOpt = preferencesRepository.findByUserId(userId);
            NotificationPreferences prefs;

            if (prefsOpt.isPresent()) {
                prefs = prefsOpt.get();
            } else {
                // Crear nuevas preferencias si no existen
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isEmpty()) {
                    log.warn("User not found with ID: {}", userId);
                    return false;
                }
                prefs = NotificationPreferences.builder()
                        .user(userOpt.get())
                        .build();
            }

            // Actualizar las preferencias
            prefs.setClassReminders(preferencesDTO.getClassReminders());
            prefs.setPaymentDue(preferencesDTO.getPaymentDue());
            prefs.setNewClasses(preferencesDTO.getNewClasses());
            prefs.setPromotions(preferencesDTO.getPromotions());
            prefs.setClassCancellations(preferencesDTO.getClassCancellations());
            prefs.setGeneralAnnouncements(preferencesDTO.getGeneralAnnouncements());

            preferencesRepository.save(prefs);
            log.debug("Updated notification preferences for user: {}", userId);
            return true;
            
        } catch (Exception e) {
            log.error("Error updating notification preferences for user {}: {}", userId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional
    public void createDefaultPreferencesIfNotExists(Long userId) {
        if (!preferencesRepository.existsByUserId(userId)) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                NotificationPreferences defaultPrefs = NotificationPreferences.builder()
                        .user(userOpt.get())
                        .classReminders(true)
                        .paymentDue(true)
                        .newClasses(true)
                        .promotions(false)
                        .classCancellations(true)
                        .generalAnnouncements(true)
                        .build();
                preferencesRepository.save(defaultPrefs);
                log.debug("Created default notification preferences for user: {}", userId);
            } else {
                log.warn("Cannot create default preferences: User not found with ID: {}", userId);
            }
        }
    }

    @Override
    public boolean isNotificationTypeEnabledForUser(Long userId, String notificationType) {
        try {
            Optional<NotificationPreferences> prefsOpt = preferencesRepository.findByUserId(userId);
            if (prefsOpt.isEmpty()) {
                // Si no hay preferencias, crear las por defecto y usar esos valores
                createDefaultPreferencesIfNotExists(userId);
                return getDefaultValueForNotificationType(notificationType);
            }

            NotificationPreferences prefs = prefsOpt.get();
            return isTypeEnabled(prefs, notificationType);
            
        } catch (Exception e) {
            log.error("Error checking notification type {} for user {}: {}", notificationType, userId, e.getMessage(), e);
            // En caso de error, permitir la notificación para no bloquear funcionalidad crítica
            return true;
        }
    }

    @Override
    public NotificationPreferencesDTO createDefaultPreferencesDTO() {
        return NotificationPreferencesDTO.builder()
                .classReminders(true)
                .paymentDue(true)
                .newClasses(true)
                .promotions(false)
                .classCancellations(true)
                .generalAnnouncements(true)
                .build();
    }

    /**
     * Mapea una entidad NotificationPreferences a DTO
     */
    private NotificationPreferencesDTO mapToDTO(NotificationPreferences prefs) {
        return NotificationPreferencesDTO.builder()
                .classReminders(prefs.getClassReminders())
                .paymentDue(prefs.getPaymentDue())
                .newClasses(prefs.getNewClasses())
                .promotions(prefs.getPromotions())
                .classCancellations(prefs.getClassCancellations())
                .generalAnnouncements(prefs.getGeneralAnnouncements())
                .build();
    }

    /**
     * Verifica si un tipo de notificación está habilitado en las preferencias
     */
    private boolean isTypeEnabled(NotificationPreferences prefs, String notificationType) {
        return switch (notificationType.toLowerCase()) {
            case "class_reminder", "class_reminders" -> prefs.getClassReminders();
            case "payment_due", "payment" -> prefs.getPaymentDue();
            case "new_classes", "new_class" -> prefs.getNewClasses();
            case "promotions", "promotion" -> prefs.getPromotions();
            case "class_cancellations", "class_cancellation" -> prefs.getClassCancellations();
            case "general", "general_announcements", "announcement" -> prefs.getGeneralAnnouncements();
            default -> {
                log.debug("Unknown notification type: {}, allowing by default", notificationType);
                yield true;
            }
        };
    }

    /**
     * Obtiene el valor por defecto para un tipo de notificación
     */
    private boolean getDefaultValueForNotificationType(String notificationType) {
        return switch (notificationType.toLowerCase()) {
            case "class_reminder", "class_reminders" -> true;
            case "payment_due", "payment" -> true;
            case "new_classes", "new_class" -> true;
            case "promotions", "promotion" -> false;
            case "class_cancellations", "class_cancellation" -> true;
            case "general", "general_announcements", "announcement" -> true;
            default -> true;
        };
    }
}