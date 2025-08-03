package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.NotificationDTO;

import java.util.List;

public interface INotificationService {
    List<NotificationDTO> getAllByUserId(Long id);
}
