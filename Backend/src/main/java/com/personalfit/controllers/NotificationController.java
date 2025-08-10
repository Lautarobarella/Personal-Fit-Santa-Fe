package com.personalfit.controllers;

import com.personalfit.dto.Notification.NotificationDTO;
import com.personalfit.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/user/{id}")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.getAllByUserId(id));
    }

}
