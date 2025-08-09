package com.personalfit.personalfit.services.impl;

import com.personalfit.personalfit.dto.NotificationDTO;
import com.personalfit.personalfit.models.Notification;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.INotificationRepository;
import com.personalfit.personalfit.services.INotificationService;
import com.personalfit.personalfit.services.IUserService;
import com.personalfit.personalfit.services.impl.WebSocketSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements INotificationService {

    @Autowired
    private INotificationRepository notificationRepository;
    
    @Autowired
    private WebSocketSessionService webSocketService;

    @Override
    public List<NotificationDTO> getAllByUserId(Long id) {
        List<Notification> notifications = notificationRepository.findByUserId(id);
        return convertToDTOList(notifications);
    }

    @Override
    public List<NotificationDTO> getUnreadByUserId(Long id) {
        List<Notification> notifications = notificationRepository.findByUserIdAndReadOrderByDateDesc(id, false);
        return convertToDTOList(notifications);
    }

    @Override
    public List<NotificationDTO> getReadByUserId(Long id) {
        List<Notification> notifications = notificationRepository.findByUserIdAndReadOrderByDateDesc(id, true);
        return convertToDTOList(notifications);
    }

    @Override
    public List<NotificationDTO> getArchivedByUserId(Long id) {
        List<Notification> notifications = notificationRepository.findByUserIdAndArchivedOrderByDateDesc(id, true);
        return convertToDTOList(notifications);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.updateReadStatus(notificationId, true);
        // Enviar actualización por WebSocket
        sendUnreadCountUpdateForNotification(notificationId);
    }

    @Override
    @Transactional
    public void markAsUnread(Long notificationId) {
        notificationRepository.updateReadStatus(notificationId, false);
        // Enviar actualización por WebSocket
        sendUnreadCountUpdateForNotification(notificationId);
    }

    @Override
    @Transactional
    public void archiveNotification(Long notificationId) {
        notificationRepository.updateArchivedStatus(notificationId, true);
        notificationRepository.updateReadStatus(notificationId, true);
        // Enviar actualización por WebSocket
        sendUnreadCountUpdateForNotification(notificationId);
    }

    @Override
    @Transactional
    public void unarchiveNotification(Long notificationId) {
        notificationRepository.updateArchivedStatus(notificationId, false);
        // Enviar actualización por WebSocket
        sendUnreadCountUpdateForNotification(notificationId);
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId) {
        // Obtener la notificación antes de eliminarla para saber a qué usuario pertenece
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        Long userId = notification.getUser().getId();
        
        notificationRepository.deleteById(notificationId);
        // Enviar actualización por WebSocket
        sendUnreadCountUpdateForUser(userId);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
        // Enviar actualización por WebSocket
        sendUnreadCountUpdateForUser(userId);
    }

    @Override
    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndRead(userId, false);
    }

    private List<NotificationDTO> convertToDTOList(List<Notification> notifications) {
        return notifications.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private NotificationDTO convertToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .date(notification.getDate())
                .read(notification.getRead())
                .archived(notification.getArchived())
                .infoType(notification.getInfoType())
                .notificationCategory(notification.getNotificationCategory())
                .createdAt(notification.getDate())
                .build();
    }

    @Override
    @Transactional
    public void createPaymentExpiredNotification(List<User> users, List<User> admins){
        System.out.println("Creando notificaciones de pago vencido para " + users.size() + " usuarios y " + admins.size() + " admins");
        
        List<Notification> notifications = new ArrayList<>();

        for(User user : users) {
            // Notificacion para el usuario con pago vencido
            Notification notification = new Notification();
            notification.setTitle("Pago vencido");
            notification.setMessage("Tu pago está vencido. Por favor, realiza el pago lo antes posible.");
            notification.setUser(user);
            notification.setDate(LocalDateTime.now());
            notification.setInfoType("warning");
            notification.setNotificationCategory("payment");
            notification.setRead(false);
            notification.setArchived(false);
            notifications.add(notification);
            
            // Notificacion para los admins
            for (User admin : admins) {
                Notification notificationAdmin = new Notification();
                notificationAdmin.setTitle("Pago vencido");
                notificationAdmin.setMessage("El usuario " + user.getFullName() + " tiene un pago vencido.");
                notificationAdmin.setUser(admin);
                notificationAdmin.setDate(LocalDateTime.now());
                notificationAdmin.setInfoType("warning");
                notificationAdmin.setNotificationCategory("payment");
                notificationAdmin.setRead(false);
                notificationAdmin.setArchived(false);
                notifications.add(notificationAdmin);
            }
        }

        System.out.println("Guardando " + notifications.size() + " notificaciones en la base de datos...");
        List<Notification> savedNotifications = notificationRepository.saveAll(notifications);
        System.out.println("Se guardaron " + savedNotifications.size() + " notificaciones exitosamente");
        
        // Enviar contador de notificaciones no leídas por WebSocket
        sendUnreadCountUpdates(savedNotifications);
    }

    @Override
    @Transactional
    public void createBirthdayNotification(List<User> users, List<User> admins) {
        System.out.println("Creando notificaciones de cumpleaños para " + users.size() + " usuarios y " + admins.size() + " admins");
        
        List<Notification> notifications = new ArrayList<>();

        for(User user : users) {
            // Notificacion para el usuario que cumple años
            Notification notification = new Notification();
            notification.setTitle("¡Feliz cumpleaños!");
            notification.setMessage("¡Feliz cumpleaños! Que tengas un día maravilloso.");
            notification.setUser(user);
            notification.setDate(LocalDateTime.now());
            notification.setInfoType("success");
            notification.setNotificationCategory("client");
            notification.setRead(false);
            notification.setArchived(false);
            notifications.add(notification);
        }

        for(User admin : admins) {
            // Notificacion para los cumpleaños
            for(User user : users) {
                Notification notificationAdmin = new Notification();
                notificationAdmin.setTitle("Cumpleaños de " + user.getFirstName());
                notificationAdmin.setMessage("Hoy es el cumpleaños de " + user.getFullName() + "! Deséale un feliz cumpleaños!");
                notificationAdmin.setUser(admin);
                notificationAdmin.setDate(LocalDateTime.now());
                notificationAdmin.setInfoType("info");
                notificationAdmin.setNotificationCategory("client");
                notificationAdmin.setRead(false);
                notificationAdmin.setArchived(false);
                notifications.add(notificationAdmin);
            }
        }

        System.out.println("Guardando " + notifications.size() + " notificaciones de cumpleaños...");
        List<Notification> savedNotifications = notificationRepository.saveAll(notifications);
        System.out.println("Se guardaron " + savedNotifications.size() + " notificaciones de cumpleaños exitosamente");
        
        // Enviar contador de notificaciones no leídas por WebSocket
        sendUnreadCountUpdates(savedNotifications);
    }

    @Override
    @Transactional
    public void createAttendanceWarningNotification(List<User> users, List<User> admins) {
        System.out.println("Creando notificaciones de asistencia para " + users.size() + " usuarios y " + admins.size() + " admins");
        
        List<Notification> notifications = new ArrayList<>();

        for(User user : users) {
            // Notificacion para el usuario con inasistencia
            Notification notification = new Notification();
            notification.setTitle("Recordatorio de asistencia");
            notification.setMessage("Hace varios días que no asistes al gimnasio. ¡Te extrañamos! Ven a entrenar.");
            notification.setUser(user);
            notification.setDate(LocalDateTime.now());
            notification.setInfoType("info");
            notification.setNotificationCategory("activity");
            notification.setRead(false);
            notification.setArchived(false);
            notifications.add(notification);
        }

        for(User admin : admins) {
            // Notificacion para los admins sobre inasistencias
            for(User user : users) {
                Notification notificationAdmin = new Notification();
                notificationAdmin.setTitle("Inasistencia de " + user.getFirstName());
                notificationAdmin.setMessage(user.getFullName() + " hace varios días que no asiste al gimnasio. Contactalo para saber si necesita ayuda.");
                notificationAdmin.setUser(admin);
                notificationAdmin.setDate(LocalDateTime.now());
                notificationAdmin.setInfoType("warning");
                notificationAdmin.setNotificationCategory("activity");
                notificationAdmin.setRead(false);
                notificationAdmin.setArchived(false);
                notifications.add(notificationAdmin);
            }
        }

        System.out.println("Guardando " + notifications.size() + " notificaciones de asistencia...");
        List<Notification> savedNotifications = notificationRepository.saveAll(notifications);
        System.out.println("Se guardaron " + savedNotifications.size() + " notificaciones de asistencia exitosamente");
        
        // Enviar contador de notificaciones no leídas por WebSocket
        sendUnreadCountUpdates(savedNotifications);
    }
    
    // Método privado para enviar contador de notificaciones no leídas
    private void sendUnreadCountUpdates(List<Notification> notifications) {
        System.out.println("=== INICIANDO ENVÍO DE ACTUALIZACIONES WEB SOCKET ===");
        System.out.println("Total de notificaciones a procesar: " + notifications.size());
        
        // Debug: mostrar estado de sesiones antes de enviar
        webSocketService.debugSessions();
        
        for (Notification notification : notifications) {
            Long userId = notification.getUser().getId();
            System.out.println("Procesando notificación para usuario: " + userId);
            
            try {
                // Obtener contador de notificaciones no leídas
                Long unreadCount = getUnreadCount(userId);
                System.out.println("Contador de notificaciones no leídas para usuario " + userId + ": " + unreadCount);
                
                // Verificar si el usuario está conectado
                boolean isConnected = webSocketService.isUserConnected(userId.toString());
                System.out.println("Usuario " + userId + " conectado: " + isConnected);
                
                // Enviar actualización por WebSocket (solo si está conectado)
                if (isConnected) {
                    System.out.println("Enviando actualización WebSocket a usuario " + userId);
                    webSocketService.sendNotificationUpdateToUser(
                        userId,
                        "/queue/notifications",
                        unreadCount
                    );
                    System.out.println("✓ Contador de notificaciones enviado a usuario " + userId + ": " + unreadCount);
                } else {
                    System.out.println("✗ Usuario " + userId + " no está conectado, no se envía WebSocket");
                }
            } catch (Exception e) {
                System.err.println("❌ Error al enviar notificación WebSocket para usuario " + userId + ": " + e.getMessage());
                e.printStackTrace();
                // No fallar la creación de notificaciones por errores de WebSocket
            }
        }
        System.out.println("=== FINALIZADO ENVÍO DE ACTUALIZACIONES WEB SOCKET ===");
    }

    private void sendUnreadCountUpdateForNotification(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        Long userId = notification.getUser().getId();
        sendUnreadCountUpdateForUser(userId);
    }

    private void sendUnreadCountUpdateForUser(Long userId) {
        try {
            Long unreadCount = getUnreadCount(userId);
            boolean isConnected = webSocketService.isUserConnected(userId.toString());
            if (isConnected) {
                webSocketService.sendNotificationUpdateToUser(
                    userId,
                    "/queue/notifications",
                    unreadCount
                );
                System.out.println("✓ Contador de notificaciones enviado a usuario " + userId + ": " + unreadCount);
            } else {
                System.out.println("✗ Usuario " + userId + " no está conectado, no se envía WebSocket");
            }
        } catch (Exception e) {
            System.err.println("❌ Error al enviar actualización WebSocket para usuario " + userId + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}
