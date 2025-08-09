package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.NotificationDTO;
import com.personalfit.personalfit.models.User;

import java.util.List;

public interface INotificationService {
    List<NotificationDTO> getAllByUserId(Long id);
    List<NotificationDTO> getUnreadByUserId(Long id);
    List<NotificationDTO> getReadByUserId(Long id);
    List<NotificationDTO> getArchivedByUserId(Long id);
    void markAsRead(Long notificationId);
    void markAsUnread(Long notificationId);
    void archiveNotification(Long notificationId);
    void unarchiveNotification(Long notificationId);
    void deleteNotification(Long notificationId);
    void markAllAsRead(Long userId);
    Long getUnreadCount(Long userId);
    void createPaymentExpiredNotification(List<User> users, List<User> admins);
    void createBirthdayNotification(List<User> users, List<User> admins);
    void createAttendanceWarningNotification(List<User> users, List<User> admins);
}
