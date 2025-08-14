package com.personalfit.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.personalfit.dto.Notification.NotificationDTO;
import com.personalfit.models.Notification;
import com.personalfit.models.User;
import com.personalfit.repository.NotificationRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<NotificationDTO> getAllByUserId(Long id) {
        try {
            List<Notification> notifications = notificationRepository.findByUserId(id);
            
            // Si no hay notificaciones, devolver lista vacía
            if (notifications == null || notifications.isEmpty()) {
                return new ArrayList<>();
            }

            return notifications.stream().map(n -> {
                return NotificationDTO.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .date(n.getDate()) // Usar date en lugar de createdAt
                        .build();
            }).collect(Collectors.toList());
        } catch (Exception e) {
            // Log error pero devolver lista vacía en lugar de lanzar excepción
            System.err.println("Error fetching notifications for user " + id + ": " + e.getMessage());
            return new ArrayList<>();
        }
    }

    @Transactional
    public void createPaymentExpiredNotification(List<User> users, List<User> admins) {
        List<Notification> notifications = new ArrayList<>();

        for (User user : users) {
            // Notificacion para el usuario con pago vencido
            Notification notification = new Notification();
            notification.setTitle("Pago vencido");
            notification.setMessage("Tu pago está vencido. Por favor, realiza el pago lo antes posible.");
            notification.setUser(user);
            notification.setDate(LocalDateTime.now());
            notifications.add(notification);
            // Descomentar si queres que tambien se notifique a los admins
            // for (User admin : admins) {
            // Notification notificationAdmin = new Notification();
            // notificationAdmin.setTitle("Pago vencido");
            // notificationAdmin.setMessage("El usuario " + user.getFullName() + " tiene un
            // pago vencido.");
            // notificationAdmin.setUser(admin);
            // notificationAdmin.setDate(LocalDateTime.now());
            // notifications.add(notificationAdmin);
            // }
        }

        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void createBirthdayNotification(List<User> users, List<User> admins) {
        List<Notification> notifications = new ArrayList<>();

        for (User user : admins) {
            Notification notification = new Notification();
            notification.setTitle("Cumple de " + user.getFirstName());
            notification.setMessage("Hoy es el cumpleaños de " + user.getFullName() + "! Deseale un feliz cumpleaños!");
            notification.setUser(user);
            notification.setDate(LocalDateTime.now());
            notifications.add(notification);
        }

        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void createAttendanceWarningNotification(List<User> users, List<User> admins) {
        List<Notification> notifications = new ArrayList<>();

        for (User user : admins) {
            Notification notification = new Notification();
            notification.setTitle("Inasistencia de " + user.getFirstName());
            notification.setMessage(user.getFullName()
                    + "Hace 4 días que no asiste al gimnasio. Contactalo para saber si necesita ayuda.");
            notification.setUser(user);
            notification.setDate(LocalDateTime.now());
            notifications.add(notification);
        }

        notificationRepository.saveAll(notifications);
    }

}
