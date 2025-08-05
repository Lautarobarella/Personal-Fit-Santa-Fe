package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.NotificationDTO;
import com.personalfit.personalfit.models.User;

import java.util.List;

public interface INotificationService {
    List<NotificationDTO> getAllByUserId(Long id);
    void createPaymentExpiredNotification(List<User> users, List<User> admins);
    void createBirthdayNotification(List<User> users, List<User> admins);
    void createAttendanceWarningNotification(List<User> users, List<User> admins);
}
