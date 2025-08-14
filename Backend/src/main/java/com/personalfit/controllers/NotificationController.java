package com.personalfit.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.dto.Notification.NotificationDTO;
import com.personalfit.services.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    /**
     * Obtiene las notificaciones de un usuario específico
     */
    @GetMapping("/user/{id}")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(@PathVariable Long id) {
        try {
            List<NotificationDTO> notifications = notificationService.getAllByUserId(id);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            // Log the error and return empty list to avoid 500 errors
            System.err.println("Error fetching notifications for user " + id + ": " + e.getMessage());
            return ResponseEntity.ok(List.of()); // Return empty list instead of error
        }
    }

}
