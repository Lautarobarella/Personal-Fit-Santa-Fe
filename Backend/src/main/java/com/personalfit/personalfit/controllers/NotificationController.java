package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.dto.NotificationDTO;
import com.personalfit.personalfit.services.INotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private INotificationService notificationService;

    @GetMapping("/user/{id}")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.getAllByUserId(id));
    }

    @GetMapping("/user/{id}/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.getUnreadByUserId(id));
    }

    @GetMapping("/user/{id}/read")
    public ResponseEntity<List<NotificationDTO>> getReadNotifications(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.getReadByUserId(id));
    }

    @GetMapping("/user/{id}/archived")
    public ResponseEntity<List<NotificationDTO>> getArchivedNotifications(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.getArchivedByUserId(id));
    }

    @GetMapping("/user/{id}/unread-count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.getUnreadCount(id));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/unread")
    public ResponseEntity<Void> markAsUnread(@PathVariable Long id) {
        notificationService.markAsUnread(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<Void> archiveNotification(@PathVariable Long id) {
        notificationService.archiveNotification(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/unarchive")
    public ResponseEntity<Void> unarchiveNotification(@PathVariable Long id) {
        notificationService.unarchiveNotification(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/user/{id}/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(@PathVariable Long id) {
        notificationService.markAllAsRead(id);
        return ResponseEntity.ok().build();
    }
}
