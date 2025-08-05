package com.personalfit.personalfit.services.impl;

import com.personalfit.personalfit.dto.NotificationDTO;
import com.personalfit.personalfit.models.Notification;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.INotificationRepository;
import com.personalfit.personalfit.services.INotificationService;
import com.personalfit.personalfit.services.IUserService;
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

    @Override
    public List<NotificationDTO> getAllByUserId(Long id) {
        List<Notification> notifications = notificationRepository.findByUserId(id);

        return notifications.stream().map(n -> {
            return NotificationDTO.builder()
                    .id(n.getId())
                    .title(n.getTitle())
                    .message(n.getMessage())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void createPaymentExpiredNotification(List<User> users, List<User> admins){
        List<Notification> notifications = new ArrayList<>();

        for(User user : users) {
            // Notificacion para el usuario con pago vencido
            Notification notification = new Notification();
            notification.setTitle("Pago vencido");
            notification.setMessage("Tu pago está vencido. Por favor, realiza el pago lo antes posible.");
            notification.setUser(user);
            notification.setDate(LocalDateTime.now());
            notifications.add(notification);
            // Descomentar si queres que tambien se notifique a los admins
//            for (User admin : admins) {
//                Notification notificationAdmin = new Notification();
//                notificationAdmin.setTitle("Pago vencido");
//                notificationAdmin.setMessage("El usuario " + user.getFullName() + " tiene un pago vencido.");
//                notificationAdmin.setUser(admin);
//                notificationAdmin.setDate(LocalDateTime.now());
//                notifications.add(notificationAdmin);
//            }
        }

        notificationRepository.saveAll(notifications);
    }

    @Override
    @Transactional
    public void createBirthdayNotification(List<User> users, List<User> admins) {
        List<Notification> notifications = new ArrayList<>();

        for(User user : admins) {
            Notification notification = new Notification();
            notification.setTitle("Cumple de " + user.getFirstName());
            notification.setMessage("Hoy es el cumpleaños de " + user.getFullName() + "! Deseale un feliz cumpleaños!");
            notification.setUser(user);
            notification.setDate(LocalDateTime.now());
            notifications.add(notification);
        }

        notificationRepository.saveAll(notifications);
    }

    @Override
    @Transactional
    public void createAttendanceWarningNotification(List<User> users, List<User> admins) {
        List<Notification> notifications = new ArrayList<>();

        for(User user : admins) {
            Notification notification = new Notification();
            notification.setTitle("Inasistencia de " + user.getFirstName());
            notification.setMessage(user.getFullName() + "Hace 4 días que no asiste al gimnasio. Contactalo para saber si necesita ayuda.");
            notification.setUser(user);
            notification.setDate(LocalDateTime.now());
            notifications.add(notification);
        }

        notificationRepository.saveAll(notifications);
    }

}
